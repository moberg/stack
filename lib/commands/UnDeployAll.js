const Process = require('../util/Process');
const Command = require('../model/command/Command');

class UnDeployAll extends Command {
  get commandName() { return 'undeploy-all'; }
  get commandDescription() { return 'Undeploys the entire stack'; }

  async run(stack) {
    await super.run(stack);
    const kubeListAndDelete = async (listCmd, deleteCmd) => {
      const text = await Process.run(listCmd, { debug: false });
      try {
        const deployments = JSON.parse(text);
        await deployments.items
          .filter(item => item.metadata.name.startsWith(stack.name))
          .forEach(async (item) => {
            await Process.run(`${deleteCmd}/${item.metadata.name}`, { debug: false });
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

module.exports = UnDeployAll;
