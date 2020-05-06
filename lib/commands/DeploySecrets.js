const Process = require('../util/Process');
const Command = require('../model/command/Command');
const UnDeploySecrets = require('./UnDeploySecrets');

class DeploySecrets extends Command {
  get commandName() { return 'deploy-secrets'; }
  get commandDescription() { return 'Deploys the dev secrets to Kubernetes'; }

  get dependsOn() {
    return [UnDeploySecrets];
  }

  async run(app, state) {
    await super.run(app, state);
    const literals = app.secrets.map(l => `--from-literal=${l}=${app.stack.devSecrets[l]}`).join(' ');
    await Process.run(`kubectl create secret generic ${app.name}-secret ${literals}`, { debug: state.stack.debug });
  }
}


module.exports = DeploySecrets;
