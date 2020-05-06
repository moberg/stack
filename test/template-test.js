/* eslint-disable no-template-curly-in-string */
const assert = require('assert');
const Template = require('../lib/util/Template');

describe('Template', () => {
  describe('#constructor()', () => {
    it('the template should contain an array with the variables in the template', () => {
      const output = new Template('${v1}\n ${v2}\n ${v3} ${v4}').variables;
      assert.deepEqual(output, ['v1', 'v2', 'v3', 'v4']);
    });

    it('the variable names should be able to contain dots', () => {
      const output = new Template('this is ${v1.a.b} ${v2}').variables;
      assert.deepEqual(output, ['v1.a.b', 'v2']);
    });
  });

  describe('#render()', () => {
    it('it should substitute one variable correctly', () => {
      const output = Template.renderTemplate('this is a template with a ${variable}', { variable: 'VARIABLE' });
      assert.equal(output, 'this is a template with a VARIABLE');
    });

    it('it should substitute multiple variables correctly', () => {
      const output = Template.renderTemplate('${v1} ${v2} ${v3} ${v4}', {
        v1: '1', v2: 2, v3: 'three', v4: 4.1,
      });
      assert.equal(output, '1 2 three 4.1');
    });

    it('it should substitute multiple variables over multiple lines correctly', () => {
      const output = Template.renderTemplate('${v1}\n ${v2}\n ${v3} ${v4}', {
        v1: '1', v2: 2, v3: 'three', v4: 4.1,
      });
      assert.equal(output, '1\n 2\n three 4.1');
    });

    it('it should substitute a null value for nothing', () => {
      const output = Template.renderTemplate('value: ${v1}', { v1: null });
      assert.equal(output, 'value: ');
    });

    it('it should substitute a undefined value for nothing', () => {
      const output = Template.renderTemplate('value: ${v1}', { v1: undefined });
      assert.equal(output, 'value: ');
    });

    it('it should substitute a list with one element correctly', () => {
      const output = Template.renderTemplate('this is a template with a =[thelist,item-$]', { thelist: ['a'] });
      assert.equal(output, 'this is a template with a item-a');
    });

    it('it should substitute a list with multiple items correctly', () => {
      const output = Template.renderTemplate('this is a template with =[thelist,item-$ ]', { thelist: ['a', 'b', 'c'] });
      assert.equal(output, 'this is a template with item-a item-b item-c');
    });

    it('it should substitute a list with multiple items on multiple lines correctly', () => {
      const output = Template.renderTemplate('this is a template with =[thelist,item-$\n]', { thelist: ['a', 'b', 'c'] });
      assert.equal(output, 'this is a template with item-a\nitem-b\nitem-c');
    });

    it('it should substitute a list with multiple items on multiple lines correctly 2', () => {
      const output = Template.renderTemplate('this is a template with =[thelist,item-$\n   hello:$]', { thelist: ['a'] });
      assert.equal(output, 'this is a template with item-a\n   hello:a');
    });

    it('it should substitute a list no elements with an empty string', () => {
      const output = Template.renderTemplate('this is a template with no list items =[thelist,item-$\n]', { thelist: [] });
      assert.equal(output, 'this is a template with no list items ');
    });

    it('it should substitude a list using a nested object', () => {
      const output = Template.renderTemplate('property from nested object: =[thelist,$.a.b]', { thelist: [{ a: { b: 1 } }] });
      assert.equal(output, 'property from nested object: 1');
    });

    it('it should substitude a list using a nested object 2', () => {
      const output = Template.renderTemplate('property from nested object: =[thelist,item-$.a.b]', { thelist: [{ a: { b: 1 } }] });
      assert.equal(output, 'property from nested object: item-1');
    });

    it('it should substitude a list using a nested object 3', () => {
      const output = Template.renderTemplate('property from nested object: =[thelist,item-$.a.b thing-$.a.x]', { thelist: [{ a: { b: 1, x: 99 } }] });
      assert.equal(output, 'property from nested object: item-1 thing-99');
    });

    it('it should be possible to have multiple lists', () => {
      const output = Template.renderTemplate('multiple lists: =[list1,a-$.a b-$.b] =[list2,a-$.x b-$.y]', { list1: [{ a: 1, b: 2 }], list2: [{ x: 8, y: 9 }] });
      assert.equal(output, 'multiple lists: a-1 b-2 a-8 b-9');
    });

    it('it should be possible to change the variable prefix', () => {
      const output = Template.renderTemplate('this will not get replaced: ${v1}, but this will: $${v1}', { v1: 'hello world' }, { variablePrefix: '$$' });
      assert.equal(output, 'this will not get replaced: ${v1}, but this will: hello world');
    });

    it('it should be possible to change the list prefix', () => {
      const output = Template.renderTemplate('property from nested object: @[thelist,$.a.b]', { thelist: [{ a: { b: 1 } }] }, { listPrefix: '@' });
      assert.equal(output, 'property from nested object: 1');
    });

    it('it render a list correctly when changing the variable prefix', () => {
      const output = Template.renderTemplate(
        'this is a template with a =[thelist,item-$$]',
        { thelist: ['a'] },
        { variablePrefix: '$$' },
      );

      assert.equal(output, 'this is a template with a item-a');
    });

    it('it render a list correctly when changing the variable prefix 2', () => {
      const output = Template.renderTemplate(
        '=[repositories,resource "aws_ecr_repository" "$$" {name = "$$"}]',
        { repositories: ['a'] },
        { variablePrefix: '$$' },
      );

      assert.equal(output, 'resource "aws_ecr_repository" "a" {name = "a"}');
    });
  });
});
