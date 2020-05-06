const Process = require('../util/Process');
const Command = require('../model/command/Command');
const { spawn } = require('child_process');

/**
 * Command to open shell in a given pod
 */
class Shell extends Command {
  get commandName() {
    return 'shell';
  }

  get commandDescription() {
    return 'shell into the application';
  }

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
    await super.run(app, state);

    const currentPod = await this.getPod(app, state);
    if (!currentPod) {
      console.log(`${app.name} not running`);
      return Command.NO_STATE_CHANGE;
    }

    console.log(`Launching Shell in ${currentPod.metadata.name}`);

    const parameters = ['exec', '-it', `${currentPod.metadata.name}`, '/bin/sh'];

    return new Promise((accept) => {
      const cp = spawn('kubectl', parameters, { stdio: [0, 1, 2] });
      cp.on('close', (code) => {
        if (code === 0) {
          accept();
        } else {
          console.log('If you see an error that "None of your factors are supported" you need to go into Okta settings and enable MFA. Okta CLI does not support push.');
          process.exit(1);
        }
      });
    });
  }
}

module.exports = Shell;
