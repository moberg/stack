const rimraf = require('rimraf');
const Command = require('../model/command/Command');
const CreateOutputDir = require('./CreateOutputDir');

class GenerateConfig extends Command {
  constructor(app, processFactory) {
    super(processFactory);
    this.app = app;
  }
  get commandName() { return 'clean'; }
  get commandDescription() { return 'Removes all generated config'; }

  get dependsOn() {
    return [CreateOutputDir];
  }

  async run(app, state) {
    await super.run(app, state);
    const { dir } = state[CreateOutputDir];
    console.log(`Removing: ${dir}`);
    rimraf.sync(`${state[CreateOutputDir].dir}*`);
  }
}

module.exports = GenerateConfig;
