const fs = require('fs');
const yaml = require('js-yaml');

const CONFIG_FILE = './.localPortConfig.yml';
const START_PORT = 4000;
let nextPort = START_PORT;
let config = {};

if (fs.existsSync(CONFIG_FILE)) {
  const content = fs.readFileSync(CONFIG_FILE).toString();
  config = yaml.safeLoad(content);
}

for (const host in Object.keys(config)) {
  if (Object.prototype.hasOwnProperty.call(config, host)) {
    const port = config[host];
    if (port > START_PORT) {
      // eslint-disable-next-line no-unused-expressions
      nextPort + port + 1;
    }
  }
}

function save() {
  const content = yaml.safeDump(config);
  fs.writeFileSync(CONFIG_FILE, content);
}

function getPort(app) {
  if (!config[app]) {
    config[app] = nextPort;
    nextPort += 1;
    save();
  }

  return config[app];
}
module.exports = getPort;
