const Command = require('../model/command/Command');
const GenerateDockerConfig = require('./GenerateDockerConfig');

class PrintVersion extends Command {
  get commandName() { return 'version'; }
  get commandDescription() { return 'Print the generated version for the app'; }

  get dependsOn() {
    return [GenerateDockerConfig];
  }

  async run(app, state) {
    const { version } = state[GenerateDockerConfig];
    console.log(`${app.name}: ${version}`);
  }
}

module.exports = PrintVersion;
