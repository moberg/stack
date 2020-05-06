const Process = require('../util/Process');
const Command = require('../model/command/Command');

class UnDeploy extends Command {
  get commandName() { return 'undeploy'; }
  get commandDescription() { return 'Undeploys the application'; }

  async run(app, state) {
    await super.run(app, state);
    const kubeListAndDelete = async (listCmd, deleteCmd) => {
      const text = await Process.run(listCmd, { debug: state.stack.debug });
      try {
        const deployments = JSON.parse(text);
        await deployments.items
          .filter(item => item.metadata.name === app.host)
          .forEach(async (item) => {
            await Process.run(`${deleteCmd}/${item.metadata.name}`, { debug: state.stack.debug });
          });
      } catch (e) {
        console.log(`Caught error while deleting deployment: ${e.message}`);
        console.log(text);
      }
    };

    await kubeListAndDelete('kubectl get deployments --output=json', 'kubectl delete deployments');
    await kubeListAndDelete('kubectl get services --output=json', 'kubectl delete services');
  }
}

module.exports = UnDeploy;
