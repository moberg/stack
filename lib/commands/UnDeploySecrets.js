const Process = require('../util/Process');
const Command = require('../model/command/Command');

class UnDeploySecrets extends Command {
  get commandName() { return 'undeploy-secrets'; }
  get commandDescription() { return 'Undeploys the dev secrets to Kubernetes'; }

  get dependsOn() {
    return [];
  }

  async run(app, state) {
    await super.run(app, state);
    await Process.run(`kubectl delete secrets/${app.name}-secret || true`, { printStdErr: false }, { debug: state.stack.debug });
  }
}


module.exports = UnDeploySecrets;
