const shell = require('shelljs');

const Command = require('../model/command/Command');

class CreateOutputDir extends Command {
  get dependsOn() {
    return [];
  }

  async run(app, state) {
    await super.run(app, state);
    shell.mkdir('-p', `./out/${app.name}/kubernetes`);

    return { dir: `./out/${app.name}`, root: './out' };
  }

  supports() {
    return true;
  }
}

module.exports = CreateOutputDir;
