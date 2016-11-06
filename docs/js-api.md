## API

1. [Access the jss namespace.](#access-the-global-jss-instance)
1. [Create an own instance of JSS.](#create-an-own-jss-instance)
1. [Create Style Sheet.](#create-style-sheet)
1. [Create a Style Sheet with global selectors.](#create-a-style-sheet-with-global-selectors)
1. [Attach Style Sheet.](#attach-style-sheet)
1. [Detach Style Sheet.](#detach-style-sheet)
1. [Attach Style Sheets in a specific order.](#attach-style-sheets-in-a-specific-order)
1. [Add a rule to an existing Style Sheet.](#add-a-rule-to-an-existing-style-sheet)
1. [Delete a rule from an existing Style Sheet.](#delete-a-rule-from-an-existing-style-sheet)
1. [Add a rule dynamically.](#add-a-rule-dynamically)
1. [Get a rule.](#get-a-rule)
1. [Add multiple rules.](#add-multiple-rules)
1. [Create a rule without a Style Sheet.](#create-a-rule-without-a-style-sheet)
1. [Inline Style](#apply-a-rule-to-an-element-inline)
1. [Set or get a rule property dynamically.](#set-or-get-a-rule-property-dynamically)
1. [Convert rule to a JSON.](#convert-rule-to-a-json)
1. [Convert to CSS](#convert-to-css)

### Access the global JSS instance.

```javascript
import jss from 'jss'
```

### Create an own JSS instance.

`create([options])`

Use an own instance if the component you build should be reusable within a different project with a probably different JSS setup.

See `.setup`for `options` description.

```javascript
import {create} from 'jss'
const jss = create()
jss.use(somePlugin())
jss.createStyleSheet(...)
export default jss
```

### Setup JSS instance.

`jss.setup(options)`

Options:

 - `generateClassName` accepts a styles string and a Rule instance.
 - `plugins` an array of functions, will be passed to `jss.use`.

### Quick setup with preset.

```javascript
import preset from 'jss-preset-default'
import jss from 'jss'

jss.setup(preset())
```

### Create Style Sheet

`jss.createStyleSheet([rules], [options])`

Options:

- `media` media query - attribute of style element.
- `meta` meta information about this style - attribute of style element, for e.g. you could pass component name for easier debugging.
- `link` link jss `Rule` instances with DOM `CSSRule` instances so that styles, can be modified dynamically, false by default because it has some performance cost.
- `element` style element, will create one by default
- `index` 0 by default - determines DOM rendering order, higher number = higher specificity (inserted after)


```javascript
// Namespaced Style Sheet with generated selectors.
const sheet = jss.createStyleSheet({
  button: {
    width: 100,
    height: 100
  }
}, {media: 'print'}).attach()

console.log(sheet.classes.button) // .button--jss-0-0
```

```css
<style media="print">
  .button--jss-0-0 {
    width: 100px;
    height: 100px;
  }
</style>
```

### Create a Style Sheet with global selectors.

You need to have [jss-global](https://github.com/cssinjs/jss-global) plugin installed.

### Remove a Style Sheet.

`jss.removeStyleSheet(sheet)`

Detach the Style Sheet and remove it from the registry.

### A Style Sheets registry.

`jss.sheets`

```javascript
jss.sheets.registry // an array with all Style Sheets

jss.sheets.toString() // Returns CSS of all Style Sheets together. Useful for server-side rendering.
```

### Attach Style Sheet.

`sheet.attach()`

Insert Style Sheet into the render tree. You need to call it in order to make your Style Sheet visible for the layout.

### Detach Style Sheet.

`sheet.detach()`

Detaching unused Style Sheets will speedup every DOM node insertion and manipulation as the browser will have to do less lookups for css rules potentially to be applied to the element.

### Attach Style Sheets in a specific order.

Sheet 1 has a higher index (priority), and as such will come **after** sheet 2 in the resulting DOM.

```javascript
const sheet1 = jss.createStyleSheet({}, {index: 5, meta: 'sheet-1'}).attach()
const sheet2 = jss.createStyleSheet({}, {index: 1, meta: 'sheet-2'}).attach()
```

```html
<style type="text/css" data-meta="sheet-2"></style>
<style type="text/css" data-meta="sheet-1"></style>
```

### Add a rule to an existing Style Sheet.

`sheet.addRule([selector], rule, [options])`

#### Options.

- `index` index where the rule should be added, by default, rules are pushed at the end.
- `className` add a rule with a predefined class name.


#### Add a rule dynamically.

```javascript
const rule = sheet.addRule({
  padding: 20,
  background: 'blue'
})
document.body.innerHTML = '<button class="' + rule.className + '">Button</button>'
```

### Delete a rule from an existing Style Sheet.

To remove a rule from the DOM, Style Sheet option `link: true` should be used.
Returns `true` if rule has been removed from the DOM.

`sheet.deleteRule(name)`


### Get a rule.

`sheet.getRule(name)`

Access a rule within sheet by selector or name.

```javascript
// Using name.
const rule = sheet.getRule('myButton')
```

### Add multiple rules.

`sheet.addRules(rules)`

In case you want to add rules to the sheet separately or even at runtime.

```javascript
sheet.addRules({
  myButton: {
    float: 'left',
  },
  something: {
    display: 'none'
  }
})
```

### Create a rule without a Style Sheet.

`jss.createRule([selector], rule, [options])`

In order to apply styles directly to the element but still be able to use jss s.

```javascript
const rule = jss.createRule({
  padding: 20,
  background: 'blue'
})
```

### Apply a rule to an element inline.

`rule.applyTo(element)`

This is equivalent to `element.style.background = 'blue'` except that you could use a rule from sheet which is already defined. It uses `rule.toJSON()` internally, so same limitations are applied. [Example.](http://cssinjs.github.io/examples/inline/index.html)

```javascript
jss.createRule({
  background: 'blue'
}).applyTo(element)
```

### Set or get a rule property dynamically.

`rule.prop(name, [value])`

When option `link` is true, after stylesheet is attached, linker saves references to `CSSRule` instances so that you are able to set rules properties at any time. [Example.](http://cssinjs.github.io/examples/dynamic-props/index.html)

```javascript
const sheet = jss.createStyleSheet({
  a: {
    color: 'red'
  }
}, {link: true})

// Get the color.
sheet.getRule('a').prop('color') // red

// Set the color.
sheet.getRule('a').prop('color', 'green')
```

### Convert rule to a JSON.

`rule.toJSON()`

Returns JSON representation of a rule. Only regular rules are supported,
no nested, conditionals, keyframes or fallbacks.

Result of toJSON call can be used later to apply styles inline to the element.
It is used by `rule.applyTo()`.

### Convert to CSS.

`sheet.toString()`

If you want to get a pure CSS string from JSS for e.g. when preprocessing server side.

```javascript
import jss from 'jss'

const sheet = jss.createStyleSheet({
  button: {
    float: 'left'
  }
})

console.log(sheet.toString())
```

```css
.button--jss-0-0 {
  float: left;
}
```

### Generate your own class names

```javascript
import {create} from 'jss'

const jss = create({
  generateClassName: (stylesStr, rule) => {
    return 'my-fancy-id'
  }
})

const sheet = jss.createStyleSheet({
  button: {
    float: 'left'
  }
})

console.log(sheet.toString())
```

```css
.my-fancy-id {
  float: left;
}
```
