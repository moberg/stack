function listDependencies(deps, appName, result, processed = new Set()) {
  if (Object.keys(deps[appName]).length === 0) {
    return result;
  }

  Object.keys(deps[appName]).forEach((dep) => {
    if (!processed.has(dep)) {
      result.push(dep);
      processed.add(dep);
      listDependencies(deps, dep, result, processed);
    }
  });

  return result;
}

class DependencyGraph {
  constructor(stack) {
    this.stack = stack;

    let deps = [];
    deps.push(...this.stack._infrastructure.map(i => i.name));
    deps.push(...this.stack._apps.map(i => i.name));
    deps.push(...[].concat(...this.stack._apps
      .map(i => Object.keys(i.infrastructure))
      .filter(i => i.length > 0)));

    deps = deps.reduce((map, obj) => {
      // eslint-disable-next-line no-param-reassign
      map[obj] = {};
      return map;
    }, {});

    [...this.stack._apps, ...this.stack._infrastructure]
      .filter(app => app.type === undefined || app.type === 'app')
      .forEach((app) => {
        app.networkDependencies.forEach((d) => {
          deps[app.name][d.appName] = d.port;
        });
      });

    // Some apps reference themself and should not be considered having a dependency on themselves
    Object.keys(deps).forEach((app) => {
      if (app in deps[app]) {
        delete deps[app][app];
      }
    });

    this.deps = deps;
  }

  get() {
    return this.deps;
  }

  filterForApp(appName) {
    const dependencies = this.dependenciesOf(appName);

    const result = {};
    dependencies.forEach((app) => {
      result[app] = this.deps[app];
    });

    return result;
  }

  dependenciesOf(appName) {
    const result = new Set(listDependencies(this.deps, appName, []));
    result.add(appName);
    return result;
  }

  dependsOn(appName) {
    return new Set(Object.keys(this.deps[appName]));
  }
}

module.exports = DependencyGraph;
