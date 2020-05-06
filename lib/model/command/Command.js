const reflect = require('../../util/reflect');

class Command {
  get dependsOn() {
    return [];
  }

  get runSerial() {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  async run(app, state) {
    console.error(`#> ${this.constructor.name}: ${app.name}`);
  }

  get name() {
    return this.constructor.name;
  }

  get isAppCommand() {
    const parameters = reflect.getFunctionParamNames(this.run);
    if (parameters.length > 0 && parameters[0] === 'app') {
      return true;
    } else if (parameters.length > 0 && parameters[0] === 'stack') {
      return false;
    }

    throw new Error(`A command must either be a stack command (stack, state) or a app command (app, state), ${this.name} is neither.`);
  }

  get commandChain() {
    const chain = [];
    chain.push(this.name);
    chain.push(...this.dependsOn.map(c => c.name));

    // eslint-disable-next-line new-cap
    this.dependsOn.map(c => new c().commandChain)
      .forEach((elems) => {
        chain.push(...elems);
      });

    return Array.from(new Set(chain));
  }

  supports(app) {
    // If no app type is defined, by default all commands supports it
    return app.type === undefined;
  }

  static get NO_STATE_CHANGE() {
    return {};
  }
}

module.exports = Command;
