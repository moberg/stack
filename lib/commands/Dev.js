const commandExistsSync = require('command-exists').sync;
const Process = require('../util/Process');
const Command = require('../model/command/Command');

class Dev extends Command {
  get commandName() { return 'dev'; }
  get commandDescription() { return 'Runs an app in local development mode (injects reverse proxy into the Kubernetes cluster)'; }

  get dependsOn() {
    return [];
  }

  async run(app, state) {
    super.run(app, state);

    if (!commandExistsSync('telepresence')) {
      console.error('ERROR: telepresence is required for dev mode but is not installed. Install by running "brew cask install osxfuse && brew install datawire/blackbird/telepresence"');
      process.exit(1);
    }

    const telepresence = new Process(`telepresence --swap-deployment ${app.host} --expose ${app.localDevPort}:${app.port} --method inject-tcp`);

    process.on('SIGINT', async () => {
      telepresence.stop();
    });

    console.log(`Running '${app.name}' in development mode`);
    await telepresence.run();
  }
}


module.exports = Dev;
