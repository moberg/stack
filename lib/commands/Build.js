const Command = require('../model/command/Command');
const GenerateKubernetesDeploymentAndServiceConfig = require('./GenerateKubernetesDeploymentAndServiceConfig');

class Build extends Command {
  get commandName() { return 'build'; }
  get commandDescription() { return 'Build the Docker containers and the Kubernetes specifications.'; }

  get dependsOn() {
    return [GenerateKubernetesDeploymentAndServiceConfig];
  }
}


module.exports = Build;
