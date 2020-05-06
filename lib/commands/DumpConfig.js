const Command = require('../model/command/Command');
const Stack = require('../model/Stack');
const ConfigResolver = require('../model/ConfigResolver');

function replacer(key, value) {
  if (value instanceof Stack || value instanceof ConfigResolver) {
    return undefined;
  }
  if (['stackConfig', 'stack'].includes(key)) {
    return undefined;
  }
  return value;
}

class DumpConfig extends Command {
  get commandName() { return 'dump-config'; }
  get commandDescription() { return 'dump-config'; }

  async run(stack, state) {
    await super.run(stack, state);
    console.log(JSON.stringify(stack.getAppsAndContext().map(({ app }) => ({
      // app.host is a getter, it won't get serialized if we don't materialize it here
      host: app.host,
      ...app,
    })), replacer));
  }
}

module.exports = DumpConfig;
