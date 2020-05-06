const Command = require('../model/command/Command');

class List extends Command {
  get commandName() { return 'list-images'; }
  get commandDescription() { return 'list images'; }

  async run(stack, state) {
    await super.run(stack, state);
    const apps = [
      ...stack._apps,
      ...([].concat(...stack._apps.map(a => Object.values(a.infrastructure)))),
      ...stack._infrastructure,
    ].filter(app => app.container && app.container.dockerFile);

    console.log(apps.map(app => app.host).join('\n'));
  }
}

module.exports = List;
