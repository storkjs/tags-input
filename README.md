# tags-input
**What is it?**
The best and most efficient tags selector in the galaxy.
Has the most essential features without redundant bloat.

**Why?**
Because all other tags-input or multi-select components are too opinionated or too restricted to `<select>` style.

### Usage
Initiate the Tags Input with `new storkTagsInput(options)`. This will return a tags object for further adjusting the tags-input later.

#### Options
_element_: the HTML DOM Element that will hold the tags-input. Example: `{ element: document.getElementById('my_autocomplete') }`

_suggestionsHandler_: a Function handling what suggestions/autocomplete results are shown according to the user's input. Example:
```javascript
var suggestions_handler = function suggestions_handler(text, chosenTags, callback) {
  if(text.indexOf('dollar') > -1) {
    callback([{
      displayName: 'Currencies',
      id: 'currencies',
      items: [
        { displayName: 'US Dollar', value: 'USD' },
        { displayName: 'Australian Dollar', value: 'AUD' },
        { displayName: 'Canadian Dollar', value: 'CAD' },
        { displayName: 'Singapore Dollar', value: 'SGD' }
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
arguments: _tagObj_ {object} - tagObj.value, tagObj.displayName, tagObj.groupId, tagObj.groupDisplayName.

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
  console.log('added tag:', e.detail); // logs: {obj: {value: '', displayName: '', groupId: '', groupDisplayName: '', elm: LI}, index: 0}
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
        displayName: 'Currencies',
        id: 'currencies',
        items: [
          { displayName: 'US Dollar', value: 'USD' },
          { displayName: 'Australian Dollar', value: 'AUD' },
          { displayName: 'Canadian Dollar', value: 'CAD' },
          { displayName: 'Singapore Dollar', value: 'SGD' }
        ]
      }]);
      return;
    }

    callback([]);
};

var testTags = new storkTagsInput({
  element: document.getElementById('tagsInput'),
  suggestionsHandler: suggestions_handler,
  rechooseRemove: true,
  inputMinWidth: 70
});

testTags.addTag({ value: 'AUD', displayName: 'Australian Dollar', groupId: 'currencies', groupDisplayName: 'Currencies' });

testTags.addEventListener('tag-added', function(e) {
  console.log('added tag:', e.detail);
}, false);
testTags.addEventListener('tag-removed', function(e) {
  console.log('removed tag:', e.detail);
}, false);
```