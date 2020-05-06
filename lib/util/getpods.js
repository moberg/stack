const Process = require('../util/Process');

async function getPods(app) {
  const services = JSON.parse(await Process.run('kubectl get pods --output=json', { debug: false }));
  return services.items
    .filter(item => item.metadata.labels.app === `${app.host}`)
    .map(item => item.metadata.name);
}

module.exports = getPods;
