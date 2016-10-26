# tags-input

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/storkjs/tags-input/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/storkjs/tags-input.svg)](https://github.com/storkjs/tags-input/issues)
[![Bower version](https://badge.fury.io/bo/stork-tags.svg)](https://github.com/storkjs/tags-input/releases)

**What is it?**
The best and most efficient tags selector in the galaxy.
Has the most essential features without redundant bloat.

**Why?**
Because all other tags-input or multi-select components are too opinionated or too restricted to `<select>` style.

### TOC
- [Usage](#usage)
- [Options](#options)
- [Methods](#methods)
- [Events](#events)
- [Code Example](#code-example)
- [Demo](#demo)

### Usage
Initiate the Tags Input with `new StorkTagsInput(options)`. This will return a tags object for further adjusting the tags-input later.

#### Options
_element_: the HTML DOM Element that will hold the tags-input. Example: `{ element: document.getElementById('my_autocomplete') }`

_suggestionsHandler_: a Function handling what suggestions/autocomplete results are shown according to the user's input. Example:
```javascript
var suggestions_handler = function suggestions_handler(text, chosenTags, callback) {
  if(text.indexOf('dollar') > -1) {
    callback([{
      label: 'Currencies',
      field: 'currencies',
      items: [
        { label: 'US Dollar', value: 'USD' },
        { label: 'Australian Dollar', value: 'AUD' },
        { label: 'Canadian Dollar', value: 'CAD' },
        { label: 'Singapore Dollar', value: 'SGD' }
      ]
    }]);
    return;
  }

  callback([]);
};
```

_inputMinWidth_ [optional]: the minimum width the search input is allowed to be. defaults to 60px. Example:
`{ inputMinWidth: 75 }`

_rechooseRemove_ [optional]: whether re-choosing from the suggestions list an item that is already chosen will remove this item from the tags. defaults to `false`. Example:
`{ rechooseRemove: true }`

#### Methods
_addTag(tagObj)_: adds a new tag to the chosen tags list.
arguments: _tagObj_ {object} - tagObj.value, tagObj.label, tagObj.groupField (optional), tagObj.groupLabel (optional).

_removeTag(index)_: remove a tag from the chosenTags. arguments: _index_ {integer} - the position of the tag in the `chosenTags` array.

_addEventListener(type, listener, optionsUseCapture)_: adds an event listener to the DOM Element of the tags-input.
arguments: _type_ {string}, listener {function}, optionsUseCapture {boolean|object}. Example:
```javascript
myTags.addEventListener("tag-added", function(e) {
  console.log('added tag:', e.detail); // logs: {obj: {tag values}, index: #}
}, false);
```

#### Events
_tag-added_: when a new tag has been chosen and added to the list. this event has a _detail_ containing the tag JS object and its index in the array. Example:
```javascript
myTags.addEventListener("tag-added", function(e) {
  console.log('added tag:', e.detail); // logs: {obj: {value: '', label: '', groupField: '', groupLabel: '', elm: LI}, index: 0}
}, false);
```

_tag-removed_: when a tag is removed the list. this event has a _detail_ containing the tag JS object and its previous index in the array. Example:
```javascript
myTags.addEventListener("tag-removed", function(e) {
  console.log('added removed:', e.detail); // logs: {obj: {value: '', label: '', groupField: '', groupLabel: '', elm: LI}, index: 0}
}, false);
```

### Code Example
```html
<div id="tagsInput" style="width: 400px; height: 32px;"></div>
```

```javascript
var i, j, regex;
var suggestions_handler = function suggestions_handler(text, chosenTags, callback) {
  if(text.indexOf('dollar') > -1) {
      callback([{
        label: 'Currencies',
        field: 'currencies',
        items: [
          { label: 'US Dollar', value: 'USD' },
          { label: 'Australian Dollar', value: 'AUD' },
          { label: 'Canadian Dollar', value: 'CAD' },
          { label: 'Singapore Dollar', value: 'SGD' }
        ]
      }]);
      return;
    }

    callback([]);
};

var testTags = new StorkTagsInput({
  element: document.getElementById('tagsInput'),
  suggestionsHandler: suggestions_handler,
  rechooseRemove: true,
  inputMinWidth: 70
});

testTags.addTag({ value: 'AUD', label: 'Australian Dollar', groupField: 'currencies', groupLabel: 'Currencies' });

testTags.addEventListener('tag-added', function(e) {
  console.log('added tag:', e.detail);
}, false);
testTags.addEventListener('tag-removed', function(e) {
  console.log('removed tag:', e.detail);
}, false);
```

### Demo
[View demo on plunker](https://embed.plnkr.co/OMUPjm/)
