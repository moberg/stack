const Process = require('../util/Process');
const Command = require('../model/command/Command');
const CreateOutputDir = require('./CreateOutputDir');

class UnExpose extends Command {
  get commandName() { return 'unexpose'; }
  get commandDescription() { return 'Exposes the internal ports of the app on localhost'; }

  get dependsOn() {
    return [CreateOutputDir];
  }

  async run(app, state) {
    await super.run(app, state);
    console.log(`Removing local port mapping for: ${app.name}`);

    const deployments = JSON.parse(await Process.run('kubectl get services --output=json', { debug: state.stack.debug }));
    return deployments.items
      .filter(item => item.metadata.name === `local-${app.host}`)
      .forEach(async (item) => {
        await Process.run(`kubectl delete services/${item.metadata.name}`, { debug: state.stack.debug });
      });
  }
}


module.exports = UnExpose;
