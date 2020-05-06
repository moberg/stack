const Command = require('../model/command/Command');
const getPods = require('../util/getpods');

class GetPods extends Command {
  get commandName() { return 'get-pods'; }
  get commandDescription() { return 'Returns the pod name(s) that run the service'; }

  get dependsOn() {
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  async run(app, state) {
    const pods = await getPods(app);
    pods.forEach(pod => console.log(pod));
  }
}


module.exports = GetPods;
