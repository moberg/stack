const Process = require('../util/Process');
const Command = require('../model/command/Command');
const Build = require('./Build');
const DeploySecrets = require('./DeploySecrets');
const GenerateKubernetesDeploymentAndServiceConfig = require('./GenerateKubernetesDeploymentAndServiceConfig');

class Deploy extends Command {
  get commandName() {
    return 'deploy';
  }

  get commandDescription() {
    return 'Deploys the application';
  }

  get dependsOn() {
    return [Build, DeploySecrets];
  }

  supports(app) {
    return !app.type || app.type === 'app' || app.type === 'endpoint';
  }

  async run(app, state) {
    await super.run(app, state);
    await Process.run(`kubectl apply -f ${state[GenerateKubernetesDeploymentAndServiceConfig].dir}`, { debug: state.stack.debug });
  }
}

module.exports = Deploy;
