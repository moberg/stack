const fs = require('fs');
const shell = require('shelljs');
const Process = require('../util/Process');
const Template = require('../util/Template');
const Command = require('../model/command/Command');
const CreateOutputDir = require('./CreateOutputDir');

class Expose extends Command {
  get commandName() { return 'expose'; }
  get commandDescription() { return 'Exposes the internal ports of the app on localhost'; }

  get dependsOn() {
    return [CreateOutputDir];
  }

  async run(app, state) {
    super.run(app, state);

    const dir = `${state[CreateOutputDir].dir}/kubernetes-local`;
    shell.mkdir('-p', dir);

    const service = new Template(fs.readFileSync(`${state.stack.dir}/templates/kubernetes/service-local.yml`).toString());
    const serviceFile = `${dir}/${app.stack.name}-${app.name}-service.yml`;

    fs.writeFileSync(serviceFile, service.render({
      name: `local-${app.stack.name}-${app.name}`,
      appName: `${app.stack.name}-${app.name}`,
      port: app.localDevPort,
      targetPort: app.port,
      localDevExtraPorts: app.localDevExtraPorts,
    }));

    await Process.run(`kubectl apply -f ${dir}`, { debug: state.stack.debug });
  }
}

module.exports = Expose;
