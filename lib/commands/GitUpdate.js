const fs = require('fs');
const Process = require('../util/Process');
const Command = require('../model/command/Command');
const Lock = require('../util/Lock');
const _ = require('lodash');

const locks = [];

class GitClone extends Command {
  get commandName() { return 'update'; }
  get commandDescription() { return 'Fetches the latest code of the apps from git'; }

  get dependsOn() {
    return [];
  }

  async run(app, state) {
    if (!app.git) {
      return Command.NO_STATE_CHANGE;
    }
    await super.run(app, state);

    // If we have multiple services running git commands in the same source directory this will
    // cause hard to understand git errors. The lock limits ut to execute one git command per
    // repository at the time.
    if (!locks[app.git]) {
      locks[app.git] = new Lock();
    }
    await locks[app.git].acquire();

    const branch = app.branch || 'master';
    try {
      if (!fs.existsSync(app.path)) {
        return await Process.run(`git clone -b ${branch} --recurse-submodules ${app.git} ${app.path}`, { debug: state.stack.debug });
      }

      // verify if there are local changes and skip repository pull.
      const status = await Process.run('git status --porcelain', { path: app.path, debug: state.stack.debug });
      if (_.isEmpty(status) === false) {
        console.log(`skip ${app.git} there are local changes`);
        return Command.NO_STATE_CHANGE;
      }

      // compare the current branch with given branch.
      const actualBranch = await Process.run('git rev-parse --abbrev-ref HEAD', { path: app.path, debug: state.stack.debug });
      if (actualBranch !== branch) {
        await Process.run(`git checkout ${branch}`, { path: app.path, debug: state.stack.debug });
      }
      return await Process.run('git pull --recurse-submodules', { path: app.path, debug: state.stack.debug });
    } catch (e) {
      console.error(`ERROR: Could not run Git update for ${app.name}`);
      throw e;
    } finally {
      locks[app.git].release();
    }
  }

  supports(app) {
    return app.type === 'data' || super.supports(app);
  }
}


module.exports = GitClone;
