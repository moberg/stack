const Command = require('../model/command/Command');
const Process = require('../util/Process');

class PrintLogs extends Command {
  get commandName() { return 'status'; }
  get commandDescription() { return 'Show status of running cluster'; }

  space(str, width) {
    const add = width - (str !== undefined ? str.length : 0);

    if (add > 0) {
      return str + ' '.repeat(add);
    }

    return str;
  }

  async run(stack, state) {
    console.log(`${this.space('APP', 40)} ${this.space('STATE', 20)} ${this.space('RESTARTS', 10)} ${this.space('IP', 20)}`);

    const pods = JSON.parse(await Process.run('kubectl get pods --output=json', { debug: state.debug }));
    pods.items
      .filter(service => service.metadata.labels.app.indexOf(stack.name) === 0)
      .forEach((service) => {
        const name = service.metadata.labels.app;

        let shortName = '';
        let info = '';
        let ip = '';

        try {
          let containerStatus = [];
          if (service.status && service.status.containerStatuses) {
            containerStatus = service.status.containerStatuses.map((c) => {
              const restarts = c.restartCount;
              const status = Object.keys(c.state)[0] || '';
              const reason = c.state[status].reason || 'Running';
              const message = c.state[status].message || '';

              return {
                status, reason, message, restarts,
              };
            });
          }

          info = containerStatus.map(c => `${this.space(c.reason, 20)} ${this.space(`${c.restarts}`, 10)}`).join(', ');
          shortName = name.substr(stack.name.length + 1, name.length);
          ip = service.status.podIP;
        } finally {
          console.log(`${this.space(shortName, 40)} ${info} ${this.space(ip, 20)}`);
        }
      });

    console.log();
    console.log(`${this.space('APP', 40)} ${this.space('EXTERNAL PORT', 20)}`);
    const services = JSON.parse(await Process.run('kubectl get services --output=json', { debug: state.debug }));

    services.items
      .filter(i => i.spec.type === 'LoadBalancer')
      .filter(service => service.metadata.labels.app.indexOf(stack.name) === 0)
      .map(i => ({ app: i.spec.selector.app, ports: i.spec.ports.map(p => p.port) }))
      .forEach((i) => {
        try {
          const shortName = i.app.substr(stack.name.length + 1, i.app.length);
          console.log(`${this.space(shortName, 40)} ${this.space(i.ports.join(','), 30)}`);
        } catch (e) {
          console.log(e);
        }
      });
  }
}

module.exports = PrintLogs;
