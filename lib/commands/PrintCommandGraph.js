const commandExistsSync = require('command-exists').sync;
const Command = require('../model/command/Command');
const Process = require('../util/Process');
const GraphvizDependencyRenderer = require('../util/GraphvizDependencyRenderer');

class PrintDependencyGraph extends Command {
  get commandName() { return 'commands'; }
  get commandDescription() { return 'Generates a dependency graph of the commands (as a .png)'; }

  async run(stack, state) {
    await super.run(stack, state);
    if (!commandExistsSync('gvpr')) {
      console.error('ERROR: Graphviz is required for to render the dependency graph. Install by running "brew install graphviz"');
      process.exit(1);
    }

    // eslint-disable-next-line global-require,new-cap
    const commands = require('../model/command/commands').map(c => new c());

    const result = {};
    for (const cmd of commands) {
      const deps = {};
      for (const dep of (cmd.dependsOn || [])) {
        // eslint-disable-next-line new-cap
        deps[new dep().constructor.name] = '';
      }

      result[cmd.constructor.name] = deps;
    }

    const file = await GraphvizDependencyRenderer.render(result, 'commands.png');
    await Process.run(`open ${file}`, { debug: state.debug });

    return Command.NO_STATE_CHANGE;
  }
}

module.exports = PrintDependencyGraph;
