class DataApp {
  constructor(config) {
    Object.assign(this, config);
    this.infrastructure = {};
    this.type = 'data';
  }
}


module.exports = { DataApp };
