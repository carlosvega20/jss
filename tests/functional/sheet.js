/* eslint-disable no-underscore-dangle */

import expect from 'expect.js'
import jss, {create} from '../../src'
import {reset, computeStyle, getStyle, getCss, getRules, removeWhitespace} from '../utils'
import DomRenderer from '../../src/backends/DomRenderer'

describe('Functional: sheet', () => {
  afterEach(reset)

  describe('sheet.attach() CSS check from DOM', () => {
    function check(styles, options) {
      const sheet = jss.createStyleSheet(styles, options).attach()
      const style = getStyle()
      expect(getCss(style)).to.be(removeWhitespace(sheet.toString()))
      sheet.detach()
    }

    it('should render unnamed sheet', () => {
      check({'.a': {width: '1px', float: 'left'}}, {named: false})
    })

    it('should render named sheet', () => {
      check({a: {width: '1px', float: 'left'}})
    })

    it('should render unnamed sheet with media query', () => {
      check({
        '.a': {color: 'red'},
        '@media (min-width: 1024px)': {'.a': {color: 'blue'}},
        '@media (min-width: 1000px)': {'.a': {color: 'green'}}
      }, {named: false})
    })

    it('should render named sheet with media query', () => {
      check({
        a: {color: 'red'},
        '@media (min-width: 1024px)': {
          a: {color: 'blue'},
          b: {color: 'white'}
        },
        '@media (min-width: 100px)': {
          a: {color: 'green'}
        }
      })
    })
  })

  describe('sheet.attach() and sheet.detach()', () => {
    let sheet
    let style

    before(() => {
      sheet = jss.createStyleSheet().attach()
      style = getStyle()
    })

    it('should have attached the sheet', () => {
      expect(sheet.attached).to.be(true)
      expect(style).to.be.an(Element)
      expect(style.parentNode).to.be.an(Element)
    })

    it('should have rendered nothing inside', () => {
      expect(style.innerHTML.trim()).to.be(sheet.toString().trim())
    })

    it('should detach sheet', () => {
      sheet.detach()
      expect(sheet.attached).to.be(false)
      expect(style.parentNode).to.be(null)
    })
  })

  describe('Options: {media, meta}', () => {
    let sheet
    let style

    before(() => {
      sheet = jss.createStyleSheet(null, {media: 'screen', meta: 'test'}).attach()
      style = getStyle()
    })

    it('should have right options', () => {
      expect(sheet.options.media).to.be('screen')
      expect(sheet.options.meta).to.be('test')
    })

    it('should have rendered attributes', () => {
      expect(style.getAttribute('media'), 'screen')
      expect(style.getAttribute('data-meta'), 'test')
    })

    after(() => {
      sheet.detach()
    })
  })

  describe('Option: {link: true}', () => {
    let sheet

    beforeEach(() => {
      sheet = jss.createStyleSheet({a: {float: 'left'}}, {link: true}).attach()
    })

    it('should link the DOM node', () => {
      expect(sheet.getRule('a').renderable).to.be.a(CSSStyleRule)
    })

    it('should link the DOM node to added rule', () => {
      sheet.addRule('b', {color: 'red'})
      expect(sheet.getRule('b').renderable).to.be.a(CSSStyleRule)
    })

    after(() => {
      sheet.detach()
    })
  })

  describe('Option {virtual: true}', () => {
    it('should not render style', () => {
      const sheet = jss.createStyleSheet({a: {float: 'left'}}, {virtual: true})
      sheet.attach()
      expect(getStyle()).to.be(undefined)
      sheet.detach()
    })
  })

  describe('Option {element}', () => {
    it('should render style using provided element', () => {
      const element = document.createElement('style')
      element.type = 'text/css'
      const sheet = jss.createStyleSheet({a: {float: 'left'}}, {element})
      sheet.attach()
      expect(getCss(element)).to.be(removeWhitespace(sheet.toString()))
      sheet.detach()
    })
  })

  describe('Option: {index}', () => {
    it('should be 0 by default', () => {
      const sheet = jss.createStyleSheet({})
      expect(sheet.options.index).to.be(0)
    })

    it('should be set by the options argument', () => {
      [-50, 0, 50, 9999].forEach((n) => {
        const sheet2 = jss.createStyleSheet({}, {index: n})
        expect(sheet2.options.index).to.be(n)
      })
    })
  })

  describe('.addRule() to a named sheet', () => {
    let sheet
    let rule
    let style

    beforeEach(() => {
      sheet = jss.createStyleSheet().attach()
      rule = sheet.addRule('a', {float: 'left'})
      style = getStyle()
    })

    it('should render only 1 rule', () => {
      expect(getRules(style).length).to.be(1)
    })

    it('should render correct CSS', () => {
      expect(getCss(style)).to.be(removeWhitespace(sheet.toString()))
    })

    it('should register the rule', () => {
      expect(sheet.getRule('a')).to.be(rule)
    })

    it('should add a rule to a detached sheet', () => {
      sheet.detach()
      const newRule = sheet.addRule('b', {float: 'right'})
      sheet.attach()
      expect(sheet.getRule('b')).to.be(newRule)
    })

    it('should link sheet in rules options', () => {
      expect(sheet.getRule('a').options.sheet).to.be(sheet)
    })
  })

  describe('.addRule() with .addRule() within a plugin and attached sheet', () => {
    let style
    let sheet

    beforeEach(() => {
      function addRule(rule) {
        if (rule.name === 'a') {
          rule.options.sheet.addRule('b', {color: 'red'})
        }
      }
      const localJss = create().use(addRule)
      sheet = localJss.createStyleSheet().attach()
      sheet.addRule('a', {color: 'green'})
      style = getStyle()
    })

    afterEach(() => {
      sheet.detach()
    })

    it('should render rules in the right order', () => {
      expect(getCss(style)).to.be(removeWhitespace(sheet.toString()))
    })
  })

  describe('.addRule() with @media and attached sheet', () => {
    let style
    let sheet

    beforeEach(() => {
      sheet = jss.createStyleSheet().attach()
      sheet.addRule('a', {color: 'red'})
      // It is important to use exactly this query, because
      // IE will add "all" always when `cssRules.insertRule` is used,
      // however all others will always remove "all" if query contains a second
      // condition.
      sheet.addRule('@media all', {
        a: {color: 'green'}
      })
      style = getStyle()
    })

    afterEach(() => {
      sheet.detach()
    })

    it('should render @media', () => {
      expect(getCss(style)).to.be(removeWhitespace(sheet.toString()))
    })
  })

  describe('.addRule() with @keyframes and attached sheet', () => {
    const isSupported = 'animationName' in document.body.style
    let style
    let sheet

    // We skip this test as keyframes are not supported by browser.
    if (!isSupported) return

    beforeEach(() => {
      sheet = jss.createStyleSheet().attach()
      sheet.addRule('@keyframes id', {
        '0%': {top: '0px'}
      })
      style = getStyle()
    })

    afterEach(() => {
      sheet.detach()
    })

    it('should render @keyframes', () => {
      // Safari adds the prefix automatically.
      const css = getCss(style).replace('-webkit-', '')
      expect(css).to.be(removeWhitespace(sheet.toString()))
    })
  })

  describe('.addRule() with invalid decl to attached sheet', () => {
    let warned = false

    before(() => {
      DomRenderer.__Rewire__('warning', () => {
        warned = true
      })
    })

    it('should not throw', () => {
      const sheet = jss.createStyleSheet().attach()
      sheet.addRule('%%%%', {color: 'red'})
      expect(warned).to.be(true)
    })

    after(() => {
      DomRenderer.__ResetDependency__('warning')
    })
  })

  describe('.deleteRule', () => {
    it('should delete a rule from the sheet and DOM', () => {
      const sheet = jss.createStyleSheet(
        {a: {width: '1px'}},
        {link: true}
      ).attach()
      expect(computeStyle(sheet.classes.a).width).to.be('1px')
      expect(sheet.deleteRule('a')).to.be(true)
      expect(sheet.getRule('a')).to.be(undefined)
      expect(computeStyle(sheet.classes.a).width).not.to.be('1px')
      sheet.detach()
    })
  })

  describe('rule.prop()', () => {
    let rule
    let sheet

    before(() => {
      sheet = jss.createStyleSheet({a: {color: 'green'}}, {link: true})
      rule = sheet.getRule('a')
      sheet.attach()
    })

    it('should have initial color', () => {
      expect(rule.style.color).to.be('green')
    })

    it('should apply a style prop', () => {
      rule.prop('color', 'red')
      expect(rule.prop('color')).to.be('red')
    })

    it('should cache the new prop', () => {
      expect(rule.style.color).to.be('red')
    })

    it('should apply new prop to the DOM', () => {
      expect(rule.renderable.style.color).to.be('red')
    })

    after(() => {
      sheet.detach()
    })
  })

  describe('rule.selector', () => {
    let sheet
    let rule

    beforeEach(() => {
      sheet = jss.createStyleSheet(
        {a: {width: '1px'}},
        {link: true}
      ).attach()
      rule = sheet.getRule('a')
    })

    it('should set the selector', () => {
      rule.selector = '.test'
      expect(rule.selector).to.be('.test')
    })

    it('should apply selector to the DOM', () => {
      rule.selector = '.test'
      expect(computeStyle('test').width).to.be('1px')
    })

    it('should register the class name in sheet.classes', () => {
      expect(sheet.classes.a, 'test')
    })
  })
})
