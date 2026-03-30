/*
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-16 14:58:39
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-16 15:11:58
 */
const parser    = require('@babel/parser');
const traverseM = require('@babel/traverse');
const generateM = require('@babel/generator');
const t         = require('@babel/types');

const traverse  = traverseM.default || traverseM;
const generate  = generateM.default || generateM;

module.exports = function jgPrefixLoader(src) {
  const callback = this.async();
  const { prefix = 'jg', debug = false } = this.getOptions() || {};

  const ast = parser.parse(src, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  traverse(ast, {
    JSXAttribute(path) {
      if (
        path.node.name.name !== 'className' ||
        !t.isStringLiteral(path.node.value)
      ) return;

      const patched = path.node.value.value
        .split(/\s+/)
        .filter(Boolean)
        .map((token) =>
          token.startsWith(`${prefix}:`) ||
          token.startsWith(`${prefix}-`) ||
          token.split(':').includes(prefix)
            ? token
            : `${prefix}:${token}`,
        )
        .join(' ');

      if (debug && patched !== path.node.value.value) {
        console.log(
          `[jg-prefix] ${this.resourcePath}\n  ${path.node.value.value}\n  → ${patched}`,
        );
      }
      path.node.value = t.stringLiteral(patched);
    },
  });

  const { code, map } = generate(ast, { sourceMaps: true }, src);
  callback(null, code, map);
};
