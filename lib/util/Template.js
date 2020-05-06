const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const fetchByKey = require('./fetchByKey');
const _ = require('lodash');

function findMatches(input, rxp, transform) {
  const found = [];
  let curMatch;

  // eslint-disable-next-line no-cond-assign
  while (curMatch = rxp.exec(input)) {
    found.push(transform(curMatch));
  }

  return found;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const variables = (input, prefix) => findMatches(
  input,
  new RegExp(`${escapeRegExp(prefix)}{([^}]+)}`, 'gm'), match => match[1],
);

const lists = (input, prefix) => findMatches(
  input,
  new RegExp(`${escapeRegExp(prefix)}\\[([^,]+?),([^!]+?)\\]`, 'gm'),
  match => ({ list: match[1], expression: match[2] }),
);

const expressionVariables = (input, prefix) => findMatches(input, new RegExp(`(${escapeRegExp(prefix)}[a-zA-Z0-9_\\.]*)`, 'gm'), match => match[1]);

class Template {
  constructor(template, options = {}) {
    this._template = template;
    // eslint-disable-next-line no-param-reassign
    options.listPrefix = options.listPrefix || '=';
    // eslint-disable-next-line no-param-reassign
    options.variablePrefix = options.variablePrefix || '$';
    this.options = options;

    this._lists = lists(this._template, options.listPrefix);
    this._variables = variables(this._template, options.variablePrefix);
  }
  render(data) {
    let result = this._template;

    this._lists.forEach((elem) => {
      let value = '';

      if (Array.isArray(data[elem.list])) {
        data[elem.list].forEach((entry) => {
          let { expression } = elem;
          expressionVariables(elem.expression, this.options.variablePrefix)
            .map(e => ({
              key: e,
              value: fetchByKey(e.replace('.', '').replace(this.options.variablePrefix, ''), entry),
            }))
            .forEach((e) => {
              expression = expression.replace(e.key, e.value);
            });

          value += expression;
        });
      }
      result = result.replace(`${this.options.listPrefix}[${elem.list},${elem.expression}]`, value.trim());
    });

    for (const key of this._variables) {
      try {
        const value = _.get(data, key) || '';
        result = result.replace(`${this.options.variablePrefix}{${key}}`, value);
      } catch (e) {
        console.error(`ERROR: No config value provided for: ${key}`);
      }
    }

    return result;
  }

  renderToFile(file, data) {
    mkdirp.sync(path.dirname(file));
    fs.writeFileSync(file, this.render(data));
  }

  static write(file, data) {
    mkdirp.sync(path.dirname(file));
    fs.writeFileSync(file, data);
  }

  get variables() {
    return this._variables;
  }

  static renderTemplate(template, data, options) {
    return new Template(template, options).render(data);
  }

  static readTemplate(source, options) {
    const content = fs.readFileSync(source).toString();
    return new Template(content, options);
  }

  static readTemplateAndRender(source, destination, data, options = {}) {
    const content = fs.readFileSync(source).toString();
    return new Template(content, options).renderToFile(destination, data);
  }
}

module.exports = Template;
