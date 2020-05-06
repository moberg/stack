const Command = require('../model/command/Command');
const Process = require('../util/Process');

class PrintLogs extends Command {
  get commandName() { return 'logs'; }
  get commandDescription() { return 'Print logs'; }

  async run(app, state) {
    const services = JSON.parse(await Process.run('kubectl get pods --output=json', { debug: false }));
    await Promise.all(services.items
      .filter(item => item.metadata.labels.app === `${app.host}`)
      .map(async (item) => {
        console.log(`${item.metadata.name}:`);
        const logs = await Process.run(`kubectl logs ${item.metadata.name}`, { debug: state.stack.debug });
        console.log(logs);
      }));
  }
}

module.exports = PrintLogs;
