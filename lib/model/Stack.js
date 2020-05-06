class Stack {
  constructor(config, apps, infrastructure) {
    Object.assign(this, config);
    this._apps = apps;
    this._infrastructure = infrastructure;
  }

  getAppsAndContext() {
    const all = []
      .concat(this._infrastructure)
      .concat(this._apps)
      .map(app => ({ app, context: app }));

    for (const app of this._apps) {
      Object.keys(app.infrastructure).forEach((infra) => {
        all.push({ app: app.infrastructure[infra], context: app }); // context is the outer app
      });
    }

    return all;
  }
}

module.exports = Stack;
