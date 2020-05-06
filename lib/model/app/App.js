const Process = require('../../util/Process');
const NetworkDependency = require('../NetworkDependency');
const localDevPortConfig = require('../../config/localDevPortConfig');
const sh = require('shorthash');
const Template = require('../../util/Template');

const ignoredFilesForVersion = [
  /\.docker\//,
  /\.idea\//,
  /\.override.yml/,
];

class App {
  constructor(config, opts = { process: Process }) {
    Object.assign(this, config);
    this.run = opts.process.run;
    this.localDevPort = localDevPortConfig(this.name);
    this.localDevExtraPorts = this.container.extraPorts !== undefined
      ? this.container.extraPorts
        .map(p => ({ port: p, localPort: localDevPortConfig(`${this.name}-${p}`) }))
      : [];
  }

  /*
    The rules for creating the app version is:
    - If the git checkout of the app is clean => Use the git hash as version.
      Example: "app-f0a5609".
    - If the git checkout is NOT clean, the version is based on a combination of the git hash and
      'git diff'. It also has has "local" to the version name. Example "app-local-Z1S4OLU".

    Local versions should NEVER be uploaded to a shared registry, they should only exist in the
    developers local docker registry.
   */
  async getVersion() {
    let gitStatus = await Process.run('git status --porcelain', { path: this.path, debug: false });
    const gitHash = (await Process.run('git rev-parse --verify HEAD', { path: this.path, debug: false })).trim();

    gitStatus = gitStatus.split('\n')
      .filter(l => !ignoredFilesForVersion.some(r => r.test(l)))
      .join('\n')
      .trim();

    if (gitStatus.length === 0) {
      return `app-${gitHash}`;
    }

    const diff = await Process.run('git diff', { path: this.path, debug: false });
    const hash = sh.unique(gitHash + diff);

    return `app-local-${hash}`;
  }

  /*
   *  Variable resolution in context
   */
  resolveVariables() {
    const resolvedData = {};
    for (const v of this.variables) {
      resolvedData[v] = this.get(v);
    }

    for (const v of this.container.variables) {
      resolvedData[v] = this.get(v);
    }

    resolvedData.getValue = (key) => {
      let key2 = key;
      if (key.indexOf('${') === 0) {
        key2 = key.substr(2, key.length - 3);
      }

      return resolvedData[key2];
    };

    return resolvedData;
  }

  get(variable) {
    const variable2 = variable.startsWith('${')
      ? variable.substring(variable.lastIndexOf('{') + 1, variable.lastIndexOf('}'))
      : variable;

    try {
      const result = variable2.split('.').reduce((o, i) => o[i], this);
      if (result) {
        return result;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {
    }

    try {
      const result = variable2.split('.').reduce((o, i) => o[i], this.resolve);
      if (result) {
        return result;
      }
    } catch (e) {
      console.error(`ERROR: No config value provided for: ${variable2}`);
      process.exit(1);
    }

    return null;
  }

  /*
   *  App properties
   */
  get host() {
    return this._host || `${this.stack.name}-${this.name}`;
  }

  // Override the default host
  set host(host) {
    this._host = host;
  }

  set port(port) {
    this._port = port;
  }

  get port() {
    if (this._port) {
      return this._port;
    }

    return this.container.port;
  }

  set extraPorts(extraPorts) {
    this._extraPorts = extraPorts;
  }

  get extraPorts() {
    const ports = new Set();
    if (this._extraPorts) {
      this._extraPorts.forEach(p => ports.add(p));
    }

    if (this.container.extraPorts) {
      this.container.extraPorts.forEach(p => ports.add(p));
    }

    return Array.from(ports);
  }

  get networkDependencies() {
    const dependencies = [];

    const addNetworkDependency = (appName, port) => {
      if (dependencies.filter(n => n.appName === appName && n.port === port).length === 0) {
        dependencies.push(new NetworkDependency(appName, port));
      }
    };

    const getDependenciesFromAppVariables = (vars) => {
      vars.forEach((obj) => {
        const split = obj.split('.');
        if (obj.startsWith('infrastructure.')) {
          const name = split[1];
          const port = this.get(`infrastructure.${name}.port`);
          addNetworkDependency(name, port);
        } else if (obj.startsWith('resolve.apps')) {
          const name = split[2];

          if (split[3] === 'infrastructure') {
            const infraName = split[4];
            const port = this.get(`resolve.apps.${name}.infrastructure.${infraName}.port`);
            addNetworkDependency(infraName, port);
            dependencies.push(new NetworkDependency(this.name, infraName, port));
          } else {
            const port = this.get(`resolve.apps.${name}.port`);
            addNetworkDependency(name, port);
          }
        }
      });
    };

    getDependenciesFromAppVariables(this.variables);
    this.container.getNetworkDependencies(this)
      .forEach(n => addNetworkDependency(n.appName, n.port));

    if (this.extraDependencies) {
      this.extraDependencies.forEach((configFile) => {
        const template = Template.readTemplate(configFile);
        getDependenciesFromAppVariables(template.variables);
      });
    }

    return dependencies;
  }
}

module.exports = { App };
