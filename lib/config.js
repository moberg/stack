const commands = require('./model/command/commands');
const config = require('./model/Config');

async function load() {
  return config(commands);
}

module.exports = load;
