const fs = require('fs');
const Process = require('../util/Process');
const Command = require('../model/command/Command');
const Lock = require('../util/Lock');

const locks = [];

class GitClone extends Command {
  get dependsOn() {
    return [];
  }

  async run(app, state) {
    await super.run(app, state);

    // If we have multiple services running git commands in the same source directory this will
    // cause hard to understand git errors. The lock limits ut to execute one git command per
    // repository at the time.
    if (!locks[app.git]) {
      locks[app.git] = new Lock();
    }
    await locks[app.git].acquire();

    const branch = app.branch || 'master';
    // If the code is not cloned we clone it
    try {
      if (app.git && !fs.existsSync(app.path)) {
        return await Process.run(`git clone -b ${branch} --recurse-submodules ${app.git} ${app.path}`, { debug: state.stack.debug });
      }
    } finally {
      locks[app.git].release();
    }

    return Command.NO_STATE_CHANGE;
  }

  supports(app) {
    return app.type === 'data' || super.supports(app);
  }
}


module.exports = GitClone;
