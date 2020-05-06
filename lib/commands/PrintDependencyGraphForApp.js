const commandExistsSync = require('command-exists').sync;

const Command = require('../model/command/Command');
const Process = require('../util/Process');
const DependencyGraph = require('../model/DependencyGraph');
const GraphvizDependencyRenderer = require('../util/GraphvizDependencyRenderer');

class PrintDependencyGraphForApp extends Command {
  get commandName() { return 'app-deps'; }
  get commandDescription() { return 'Generates a dependency graph for a given app'; }

  async run(app, state) {
    await super.run(app, state);
    if (!commandExistsSync('gvpr')) {
      console.error('ERROR: Graphviz is required for to render the dependency graph. Install by running "brew install graphviz"');
      process.exit(1);
    }
    const dc = new DependencyGraph(app.resolve.stack);
    const graph = dc.filterForApp(app.name);

    const params = new Set(state.stack.params);
    if (params.has('--json')) {
      console.log(graph);
    } else if (params.has('--stats')) {
      // Exclude infrastructure
      if (app.constructor.name !== 'App') {
        return;
      }
      const dependencies = dc.get()[app.name];
      const nDependencies = Object.keys(dependencies).length;
      console.log(`${app.name}${' '.repeat(30 - app.name.length)}${nDependencies} \t\t${Object.keys(dependencies).join(', ')}`);
    } else {
      const output = `${app.name}-dependencies.png`;
      await GraphvizDependencyRenderer.render(graph, output);
      console.log(`Rendered: ${output}`);
      await Process.run(`open ${output}`, { debug: state.debug });
    }
  }
}


module.exports = PrintDependencyGraphForApp;
