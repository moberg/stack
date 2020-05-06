const commandExistsSync = require('command-exists').sync;

const Command = require('../model/command/Command');
const Process = require('../util/Process');
const DependencyGraph = require('../model/DependencyGraph');
const GraphvizDependencyRenderer = require('../util/GraphvizDependencyRenderer');

class PrintDependencyGraph extends Command {
  get commandName() { return 'deps'; }
  get commandDescription() { return 'Generates a dependency graph of the applications and services (as a .png)'; }

  async run(stack, state) {
    await super.run(stack, state);
    if (!commandExistsSync('gvpr')) {
      console.error('ERROR: Graphviz is required for to render the dependency graph. Install by running "brew install graphviz"');
      process.exit(1);
    }

    const file = await GraphvizDependencyRenderer.render(new DependencyGraph(stack).get());
    console.log(`Rendered: ${file}`);
    await Process.run(`open ${file}`, { debug: state.debug });
  }
}


module.exports = PrintDependencyGraph;
