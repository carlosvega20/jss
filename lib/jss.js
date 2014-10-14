'use strict'

var Style = require('./Style')
var Rule = require('./Rule')

exports.Style = Style

exports.Rule = Rule

/**
 * Create a stylesheet.
 *
 * @param {Object} rules
 * @param {Object} [attributes] style element attributes
 * @return {Style}
 * @api public
 */
exports.createStyle = function (rules) {
    return new Style(rules)
}