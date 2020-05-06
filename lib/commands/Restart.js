const Process = require('../util/Process');
const Command = require('../model/command/Command');

class Restart extends Command {
  get commandName() { return 'restart'; }
  get commandDescription() { return 'Restarts the app'; }

  get dependsOn() {
    return [];
  }

  async getPod(app, state) {
    const runningPods = JSON.parse(await Process.run(
      'kubectl get pods --output=json',
      { debug: state.stack.debug },
    ));

    return runningPods.items.filter(p => p.metadata.labels.app === app.host)[0];
  }

  async run(app, state) {
    super.run(app, state);

    const currentPod = await this.getPod(app, state);
    if (!currentPod) {
      console.log(`${app.name} not running`);
      return;
    }

    console.log(`Deleting pod ${currentPod.metadata.name}`);
    await Process.run(`kubectl delete pods/${currentPod.metadata.name}`, { debug: state.stack.debug });

    const newPod = await this.getPod(app, state);
    if (!newPod) {
      console.error(`ERROR: No new pod for ${app.name} was started. Check the Kubernetes status.`);
      return;
    }

    console.log(`New pod ${newPod.metadata.name}`);
  }
}

module.exports = Restart;
