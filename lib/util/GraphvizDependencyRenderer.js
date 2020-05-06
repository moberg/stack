const fs = require('fs');

class GraphvizDependencyRenderer {
  static async render(dependencies, file = 'dependencies.png') {
    return new Promise((accept) => {
      // eslint-disable-next-line global-require
      const graphviz = require('graphviz');

      const g = graphviz.digraph('G');

      const nodes = {};

      Object.keys(dependencies).forEach((service) => {
        const node = g.addNode(service, { color: 'lightblue' });
        node.set('style', 'filled');
        nodes[service] = node;
      });


      Object.keys(dependencies).forEach((service) => {
        Object.keys(dependencies[service]).forEach((dependency) => {
          const edge = g.addEdge(nodes[service], nodes[dependency]);
          edge.set('label', dependencies[service][dependency]);
        });
      });

      g.output('png', (image) => {
        fs.writeFileSync(file, image);
        accept(file);
      });
    });
  }
}

module.exports = GraphvizDependencyRenderer;
