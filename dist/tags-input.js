(function(root) {
  "use strict";
  var capitalizeWords = function capitalizeWords(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };
  var StorkTagsInput = function StorkTagsInput(options) {
    this.tagsInput = options.element;
    this.suggestionsHandler = options.suggestionsHandler;
    if (!this.rnd) {
      this.rnd = (Math.floor(Math.random() * 9) + 1) * 1e3 + Date.now() % 1e3;
    }
    this.inputMinWidth = options.inputMinWidth || 60;
    this.rechooseRemove = options.rechooseRemove || false;
    this.placeholder = options.placeholder || "";
    this.textCanvasContext = null;
    this.chosenTags = [];
    this.focusedTagIndex = null;
    this.lastSearchString = "";
    this.tagDeleteThrottle = {
      allowed: true,
      TO: undefined
    };
    this.eventListeners = [];
    this.tagsInput.classList.add("stork-tags", "stork-tags" + this.rnd);
    this.tagsInput.setAttribute("tabindex", 0);
    this.buildDom();
    this.setEventListeners();
  };
  StorkTagsInput.prototype._addEventListener = function customAddEventListener(element, type, listener, options_or_useCapture) {
    element.addEventListener(type, listener, options_or_useCapture);
    this.eventListeners.push({
      element: element,
      type: type,
      listener: listener,
      options: options_or_useCapture
    });
    return this.eventListeners.length - 1;
  };
  StorkTagsInput.prototype._removeEventListener = function customRemoveEventListener(index) {
    var currEL = this.eventListeners[index];
    if (currEL) {
      currEL.element.removeEventListener(currEL.type, currEL.listener, currEL.options);
    }
    this.eventListeners[index] = null;
  };
  StorkTagsInput.prototype._emptyEventListeners = function emptyEventListeners() {
    var currEL;
    for (var i = 0; i < this.eventListeners.length; i++) {
      currEL = this.eventListeners[i];
      if (currEL) {
        this._removeEventListener(i);
      }
    }
  };
  StorkTagsInput.prototype.addEventListener = function customAddEventListener(type, listener, options_or_useCapture) {
    this._addEventListener(this.tagsInput, type, listener, options_or_useCapture, true);
  };
  StorkTagsInput.prototype.removeEventListener = function customRemoveEventListener(type, listener, options_or_useCapture) {
    this.tagsInput.removeEventListener(type, listener, options_or_useCapture);
    for (var i = 0; i < this.eventListeners.length; i++) {
      if (this.eventListeners[i].element === this.tagsInput && this.eventListeners[i].type === type && this.eventListeners[i].listener === listener) {
        this.eventListeners[i] = null;
      }
    }
  };
  StorkTagsInput.prototype.buildDom = function buildDom() {
    var ul = document.createElement("ul");
    var inputLi = document.createElement("li");
    var input = document.createElement("input");
    inputLi.classList.add("search-li");
    inputLi.storkTagsProps = {
      state: null
    };
    input.classList.add("search");
    input.storkTagsProps = {
      paddingLeft: 0,
      paddingRight: 0
    };
    input.setAttribute("placeholder", this.placeholder);
    inputLi.appendChild(input);
    ul.appendChild(inputLi);
    this.tagsInput.appendChild(ul);
    var dropdownContainer = document.createElement("div");
    dropdownContainer.classList.add("stork-tags-dropdown-container", "stork-tags-dropdown-container" + this.rnd);
    dropdownContainer.setAttribute("tabindex", 0);
    this.ul = ul;
    this.inputLi = inputLi;
    this.input = input;
    this.dropdownContainer = dropdownContainer;
    this.dropdownContainer.storkTagsProps = {
      allLIs: this.dropdownContainer.getElementsByTagName("li"),
      hoveredLIIndex: null
    };
    this.updateSearchState();
    this.positionDropdown();
    document.body.appendChild(dropdownContainer);
  };
  StorkTagsInput.prototype.setEventListeners = function setEventListeners() {
    this._addEventListener(this.input, "keyup", this.onChangeSearchInput.bind(this), false);
    this._addEventListener(this.input, "keydown", this.onKeydownSearchInput.bind(this), false);
    this._addEventListener(this.input, "focus", this.onFocusSearchInput.bind(this), false);
    this._addEventListener(this.dropdownContainer, "click", this.onClickSuggestionsDropdown.bind(this), false);
    this._addEventListener(this.dropdownContainer, "mousemove", this.onMouseMoveSuggestionsDropdown.bind(this), false);
    this._addEventListener(this.ul, "click", this.onClickTagsArea.bind(this), false);
    this._addEventListener(document, "click", this.onClickCheckFocus.bind(this), true);
    this._addEventListener(this.tagsInput, "keydown", this.onSuggestionsKeyboardNavigate.bind(this), false);
    this._addEventListener(this.dropdownContainer, "keydown", this.onSuggestionsKeyboardNavigate.bind(this), false);
    this._addEventListener(this.tagsInput, "keydown", this.onTagsKeyboardNavigate.bind(this), false);
  };
  StorkTagsInput.prototype.positionDropdown = function positionDropdown(width) {
    if (!width) {
      this.dropdownContainer.style.width = this.tagsInput.offsetWidth + "px";
    } else {
      this.dropdownContainer.style.width = width + "px";
    }
    var coordinates = this.tagsInput.getCoordinates();
    this.dropdownContainer.style.left = coordinates.x + "px";
    this.dropdownContainer.style.top = coordinates.y + this.tagsInput.offsetHeight + 1 + "px";
  };
  StorkTagsInput.prototype.suggestionsCallback = function suggestionsCallback(suggestionsArr) {
    while (this.dropdownContainer.firstChild) {
      this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
    }
    if (suggestionsArr.length === 0) {
      this.dropdownContainer.classList.remove("has-results");
      return;
    }
    var i, j, groupDiv, groupHeader, itemsList, item, miscElm;
    for (i = 0; i < suggestionsArr.length; i++) {
      groupDiv = document.createElement("div");
      groupHeader = document.createElement("div");
      miscElm = document.createElement("span");
      itemsList = document.createElement("ul");
      miscElm.appendChild(document.createTextNode(suggestionsArr[i].label));
      groupHeader.appendChild(miscElm);
      for (j = 0; j < suggestionsArr[i].items.length; j++) {
        item = document.createElement("li");
        item.storkTagsProps = {
          value: suggestionsArr[i].items[j].value,
          label: suggestionsArr[i].items[j].label,
          groupField: suggestionsArr[i].field,
          groupLabel: suggestionsArr[i].label
        };
        miscElm = document.createElement("a");
        miscElm.appendChild(document.createTextNode(suggestionsArr[i].items[j].label));
        item.appendChild(miscElm);
        itemsList.appendChild(item);
      }
      groupDiv.appendChild(groupHeader);
      groupDiv.appendChild(itemsList);
      this.dropdownContainer.appendChild(groupDiv);
    }
    this.dropdownContainer.storkTagsProps.hoveredLIIndex = null;
    this.onMouseMoveSuggestionsDropdown({
      target: this.dropdownContainer.storkTagsProps.allLIs[0]
    });
    this.positionDropdown();
    this.dropdownContainer.classList.add("has-results");
  };
  StorkTagsInput.prototype.onClickSuggestionsDropdown = function onClickSuggestionsDropdown(e) {
    var LI = e.target, i = 0;
    while (!(LI instanceof HTMLDocument) && LI.tagName.toUpperCase() !== "LI") {
      if (i++ >= 2) {
        return;
      }
      LI = LI.parentNode;
    }
    this.addTag(LI.storkTagsProps);
    this.unfocusSuggestions();
    this.input.value = "";
    this.input.focus();
    this.onFocusSearchInput();
    this.onChangeSearchInput();
  };
  StorkTagsInput.prototype._scrollSuggestionsDropdownByItem = function _scrollSuggestionsDropdownByItem(LI) {
    var yPos = 0, yPos_bottomPart, elm = LI;
    while (elm && elm !== this.dropdownContainer && this.dropdownContainer.contains(elm)) {
      yPos += elm.offsetTop;
      elm = elm.offsetParent;
    }
    if (yPos < this.dropdownContainer.scrollTop) {
      this.dropdownContainer.scrollTop = yPos;
    } else {
      yPos_bottomPart = yPos + LI.clientHeight;
      if (this.dropdownContainer.scrollTop + this.dropdownContainer.clientHeight < yPos_bottomPart) {
        this.dropdownContainer.scrollTop = yPos_bottomPart - this.dropdownContainer.clientHeight;
      }
    }
  };
  StorkTagsInput.prototype.onMouseMoveSuggestionsDropdown = function onMouseMoveSuggestionsDropdown(e) {
    var LI = e.target, i = 0, self = this;
    if (!LI || !LI.tagName) {
      console.error("event's target is not an HTMLElement");
      return;
    }
    while (!(LI instanceof HTMLDocument) && LI.tagName.toUpperCase() !== "LI") {
      if (i++ >= 2) {
        return;
      }
      LI = LI.parentNode;
    }
    var index = this.dropdownContainer.storkTagsProps.hoveredLIIndex;
    if (Number.isInteger(index)) {
      var prevHoveredLI = this.dropdownContainer.storkTagsProps.allLIs[index];
      if (prevHoveredLI === LI) {
        return;
      }
      prevHoveredLI.classList.remove("focused");
    }
    for (i = 0; i < this.dropdownContainer.storkTagsProps.allLIs.length; i++) {
      if (LI === this.dropdownContainer.storkTagsProps.allLIs[i]) {
        LI.classList.add("focused");
        this.dropdownContainer.storkTagsProps.hoveredLIIndex = i;
        window.requestAnimationFrame(function() {
          self._scrollSuggestionsDropdownByItem(LI);
        });
        break;
      }
    }
  };
  StorkTagsInput.prototype.addTag = function addTag(tagObj) {
    var i;
    if (!tagObj.groupLabel) {
      tagObj.groupLabel = capitalizeWords(tagObj.groupField);
    }
    if (!tagObj.label) {
      tagObj.label = capitalizeWords(tagObj.value);
    }
    for (i = 0; i < this.chosenTags.length; i++) {
      if (tagObj.groupField === this.chosenTags[i].groupField && tagObj.value === this.chosenTags[i].value) {
        if (this.rechooseRemove) {
          return this.removeTag(i);
        }
        return false;
      }
    }
    var li = document.createElement("li");
    var xA = document.createElement("a");
    var groupSpan = document.createElement("span");
    var valueSpan = document.createElement("span");
    xA.appendChild(document.createTextNode("×"));
    groupSpan.appendChild(document.createTextNode(tagObj.groupLabel));
    valueSpan.appendChild(document.createTextNode(tagObj.label));
    li.classList.add("tag");
    xA.classList.add("remove");
    groupSpan.classList.add("group");
    valueSpan.classList.add("value");
    this.updateSearchState();
    li.appendChild(xA);
    li.appendChild(groupSpan);
    li.appendChild(valueSpan);
    this.ul.insertBefore(li, this.inputLi);
    var tagIndex = li.index;
    this.chosenTags.splice(tagIndex, 0, {
      value: tagObj.value,
      label: tagObj.label,
      groupField: tagObj.groupField,
      groupLabel: tagObj.groupLabel,
      elm: li
    });
    var evnt = new CustomEvent("tag-added", {
      bubbles: true,
      cancelable: true,
      detail: {
        obj: this.chosenTags[tagIndex],
        index: tagIndex
      }
    });
    this.tagsInput.dispatchEvent(evnt);
  };
  StorkTagsInput.prototype.removeTag = function removeTag(index) {
    if (this.chosenTags[index]) {
      this.unfocusTags();
      this.ul.removeChild(this.chosenTags[index].elm);
      var removed = this.chosenTags.splice(index, 1);
      if (this.chosenTags.length === 0) {
        this.updateSearchState();
      }
      var evnt = new CustomEvent("tag-removed", {
        bubbles: true,
        cancelable: true,
        detail: {
          obj: removed[0],
          index: index
        }
      });
      this.tagsInput.dispatchEvent(evnt);
      return true;
    }
    return false;
  };
  StorkTagsInput.prototype.removeAllTags = function removeAllTags() {
    this.unfocusTags();
    if (!this.ul.firstChild) {
      return false;
    }
    while (this.ul.firstChild) {
      this.ul.removeChild(this.ul.firstChild);
    }
    var removed = this.chosenTags.splice(0, this.chosenTags.length);
    if (this.chosenTags.length === 0) {
      this.updateSearchState();
    }
    var evnt = new CustomEvent("all-tags-removed", {
      bubbles: true,
      cancelable: true,
      detail: {
        removedTags: removed
      }
    });
    this.tagsInput.dispatchEvent(evnt);
    return true;
  };
  StorkTagsInput.prototype.updateSearchState = function updateSearchState() {
    if (this.chosenTags.length > 0) {
      this.inputLi.classList.add("with-tags");
      this.inputLi.classList.remove("no-tags");
      this.inputLi.storkTagsProps.state = "with-tags";
      this.input.setAttribute("placeholder", "");
      this.calculateSearchInputWidth();
    } else {
      this.inputLi.classList.add("no-tags");
      this.inputLi.classList.remove("with-tags");
      this.inputLi.storkTagsProps.state = "no-tags";
      this.input.setAttribute("placeholder", this.placeholder);
      this.input.style.width = "";
    }
  };
  StorkTagsInput.prototype.onClickTagsArea = function onClickTagsArea(e) {
    var elm = e.target, i = 0;
    do {
      if (elm.tagName.toUpperCase() === "A" && elm.classList.contains("remove")) {
        var elmIndex = elm.parentNode.index;
        this.removeTag(elmIndex);
        this.focusSearchInput(0);
        return;
      } else if (elm.tagName.toUpperCase() === "LI") {
        if (elm.classList.contains("tag")) {
          this.onClickFocusTag(elm);
        }
        return;
      } else if (elm.tagName.toUpperCase() === "UL") {
        this.redrawSearchInput(e.offsetX);
        return;
      }
      elm = elm.parentNode;
      i++;
    } while (i <= 3 && !(elm instanceof HTMLDocument));
  };
  StorkTagsInput.prototype.onClickFocusTag = function onClickFocusTag(index) {
    if (!Number.isInteger(index)) {
      index = index.index;
      if (this.inputLi.index < index) {
        index--;
      }
    }
    if (Number.isInteger(this.focusedTagIndex)) {
      this.chosenTags[this.focusedTagIndex].elm.classList.remove("focused");
    }
    this.chosenTags[index].elm.classList.add("focused");
    this.focusedTagIndex = index;
    this.tagsInput.focus();
    this.scrollLIIntoView(this.chosenTags[index].elm);
  };
  StorkTagsInput.prototype.scrollLIIntoView = function scrollLIIntoView(li) {
    if (!this._tagLIMarginLeft) {
      var tagLi = this.ul.querySelector("li.tag"), liStyle;
      if (!tagLi) {
        return;
      }
      liStyle = tagLi.currentStyle || window.getComputedStyle(tagLi);
      this._tagLIMarginLeft = parseInt(liStyle.marginLeft, 10);
    }
    var leftPos = li.offsetLeft;
    var extra = 20;
    this.tagsInput.scrollLeft = leftPos - this._tagLIMarginLeft - extra;
  };
  StorkTagsInput.prototype.redrawSearchInput = function redrawSearchInput(x) {
    if (this.chosenTags.length === 0) {
      return;
    }
    var idx, closestTagElm;
    for (idx = 0; idx < this.chosenTags.length; idx++) {
      if (!closestTagElm || Math.abs(closestTagElm.offsetLeft - x) > Math.abs(this.chosenTags[idx].elm.offsetLeft - x)) {
        closestTagElm = this.chosenTags[idx].elm;
      }
    }
    var append = this.chosenTags.last.elm === closestTagElm && Math.abs(closestTagElm.offsetLeft - x) > Math.abs(closestTagElm.offsetLeft + closestTagElm.clientWidth - x);
    if (append && this.ul.lastChild !== this.inputLi || !append && closestTagElm.previousSibling !== this.inputLi) {
      this.ul.removeChild(this.inputLi);
      this.input.value = "";
      if (append) {
        this.ul.appendChild(this.inputLi);
      } else {
        this.ul.insertBefore(this.inputLi, closestTagElm);
      }
    }
    this.calculateSearchInputWidth();
    this.input.focus();
  };
  StorkTagsInput.prototype.onClickCheckFocus = function onClickCheckFocus(e) {
    var target = e.target, evnt;
    while (!(target instanceof HTMLDocument) && target !== this.tagsInput && target !== this.dropdownContainer) {
      target = target.parentNode;
      if (target && target instanceof HTMLDocument) {
        this.tagsInput.classList.remove("focused");
        this.dropdownContainer.classList.remove("focused");
        evnt = new CustomEvent("tags-input-blur", {
          bubbles: true,
          cancelable: true
        });
        this.tagsInput.dispatchEvent(evnt);
        return;
      }
    }
    this.tagsInput.classList.add("focused");
    this.dropdownContainer.classList.add("focused");
    evnt = new CustomEvent("tags-input-focus", {
      bubbles: true,
      cancelable: true
    });
    this.tagsInput.dispatchEvent(evnt);
  };
  StorkTagsInput.prototype.onChangeSearchInput = function onChangeSearchInput(e) {
    if (this.input.value !== this.lastSearchString) {
      if (this.inputLi.storkTagsProps.state === "with-tags") {
        this.calculateSearchInputWidth();
      }
      this.suggestionsHandler(this.input.value, this.chosenTags, this.suggestionsCallback.bind(this));
    }
    this.lastSearchString = this.input.value;
  };
  StorkTagsInput.prototype.onKeydownSearchInput = function onKeydownSearchInput(event) {
    if (event.key && (event.keyCode >= 48 && event.keyCode <= 90) || event.keyCode >= 186 && event.keyCode <= 222) {
      this.calculateSearchInputWidth(this.input.value + event.key);
    }
  };
  StorkTagsInput.prototype.calculateSearchInputWidth = function calculateSearchInputWidth(text) {
    if (!this.textCanvasContext) {
      var textCanvas = document.createElement("canvas");
      var inputStyle = this.input.currentStyle || window.getComputedStyle(this.input);
      this.textCanvasContext = textCanvas.getContext("2d");
      this.textCanvasContext.font = inputStyle.fontStyle + " " + inputStyle.fontWeight + " " + inputStyle.fontSize + " " + inputStyle.fontFamily;
      this.input.storkTagsProps.paddingLeft = parseInt(inputStyle.paddingLeft, 10);
      this.input.storkTagsProps.paddingRight = parseInt(inputStyle.paddingRight, 10);
    }
    var textMetrics = this.textCanvasContext.measureText(text || this.input.value);
    this.input.style.width = Math.ceil(textMetrics.width + this.input.storkTagsProps.paddingLeft + this.input.storkTagsProps.paddingRight + 1) + "px";
  };
  StorkTagsInput.prototype.onFocusSearchInput = function onFocusSearchInput(e) {
    this.unfocusTags();
    this.scrollLIIntoView(this.inputLi);
  };
  StorkTagsInput.prototype.onSuggestionsKeyboardNavigate = function onSuggestionsKeyboardNavigate(e) {
    var key = keyboardMap[e.keyCode];
    var hoveredIndex;
    var allLIs;
    if (this.dropdownContainer.storkTagsProps.allLIs.length === 0 || !this.dropdownContainer.classList.contains("focused")) {
      return;
    }
    if (key === "DOWN" || key === "UP" || key === "ENTER") {
      e.preventDefault();
      hoveredIndex = this.dropdownContainer.storkTagsProps.hoveredLIIndex;
      allLIs = this.dropdownContainer.storkTagsProps.allLIs;
      if (key === "DOWN") {
        if (!Number.isInteger(hoveredIndex) || hoveredIndex === allLIs.length - 1) {
          this.onMouseMoveSuggestionsDropdown({
            target: allLIs[0]
          });
        } else {
          this.onMouseMoveSuggestionsDropdown({
            target: allLIs[hoveredIndex + 1]
          });
        }
      } else if (key === "UP") {
        if (!Number.isInteger(hoveredIndex) || hoveredIndex === 0) {
          this.onMouseMoveSuggestionsDropdown({
            target: allLIs[allLIs.length - 1]
          });
        } else {
          this.onMouseMoveSuggestionsDropdown({
            target: allLIs[hoveredIndex - 1]
          });
        }
      } else if (key === "ENTER") {
        if (Number.isInteger(hoveredIndex)) {
          this.onClickSuggestionsDropdown({
            target: allLIs[hoveredIndex]
          });
        } else {
          this.onMouseMoveSuggestionsDropdown({
            target: allLIs[0]
          });
        }
      }
    }
  };
  StorkTagsInput.prototype.onTagsKeyboardNavigate = function onTagsKeyboardNavigate(e) {
    var key = keyboardMap[e.keyCode];
    if (key === "LEFT") {
      if (this.input === document.activeElement && this.inputLi.previousSibling && !Number.isInteger(this.focusedTagIndex) && this.input.selectionStart === 0) {
        this.onClickFocusTag(this.inputLi.previousSibling.index);
      } else if (Number.isInteger(this.focusedTagIndex)) {
        this.redrawSearchInput(this.chosenTags[this.focusedTagIndex].elm.offsetLeft - 1);
      }
    } else if (key === "RIGHT") {
      if (this.input === document.activeElement && this.inputLi.nextSibling && !Number.isInteger(this.focusedTagIndex) && this.input.selectionStart >= this.input.value.length - 1) {
        this.onClickFocusTag(this.inputLi.nextSibling.index - 1);
      } else if (Number.isInteger(this.focusedTagIndex)) {
        this.redrawSearchInput(this.chosenTags[this.focusedTagIndex].elm.offsetLeft + this.chosenTags[this.focusedTagIndex].elm.clientWidth + 1);
      }
    } else if (key === "BACKSPACE" || key === "DELETE") {
      if (this.input === document.activeElement) {
        if (this.tagDeleteThrottle.allowed && this.input.value === "" && this.inputLi.previousSibling) {
          this.removeTag(this.inputLi.previousSibling.index);
        }
        if (this.input.value !== "" || this.tagDeleteThrottle.allowed) {
          this.tagDeleteThrottle.allowed = false;
          clearTimeout(this.tagDeleteThrottle.TO);
          this.tagDeleteThrottle.TO = setTimeout(function() {
            this.tagDeleteThrottle.allowed = true;
          }.bind(this), 400);
        }
      } else if (Number.isInteger(this.focusedTagIndex)) {
        var tmpFocusedTagIndex = this.focusedTagIndex;
        this.redrawSearchInput(this.chosenTags[this.focusedTagIndex].elm.offsetLeft - 1);
        this.removeTag(tmpFocusedTagIndex);
        this.focusSearchInput(0);
        e.preventDefault();
      }
    }
  };
  StorkTagsInput.prototype.unfocusSuggestions = function unfocusSuggestions() {
    if (Number.isInteger(this.dropdownContainer.storkTagsProps.hoveredLIIndex)) {
      this.dropdownContainer.storkTagsProps.allLIs[this.dropdownContainer.storkTagsProps.hoveredLIIndex].classList.remove("focused");
    } else {
      for (var i = 0; i < this.dropdownContainer.storkTagsProps.allLIs.length; i++) {
        if (this.dropdownContainer.storkTagsProps.allLIs[i].classList.contains("focused")) {
          this.dropdownContainer.storkTagsProps.allLIs[i].classList.remove("focused");
        }
      }
    }
    this.dropdownContainer.storkTagsProps.hoveredLIIndex = null;
  };
  StorkTagsInput.prototype.unfocusTags = function unfocusTags() {
    if (Number.isInteger(this.focusedTagIndex)) {
      this.chosenTags[this.focusedTagIndex].elm.classList.remove("focused");
    } else {
      for (var i = 0; i < this.chosenTags.length; i++) {
        if (this.chosenTags[i].elm.classList.contains("focused")) {
          this.chosenTags[i].elm.classList.remove("focused");
        }
      }
    }
    this.focusedTagIndex = null;
  };
  StorkTagsInput.prototype.focusSearchInput = function focusSearchInput(caretPosition) {
    if (!Number.isInteger(caretPosition)) {
      caretPosition = 0;
    }
    this.input.focus();
    var INP = this.input;
    setTimeout(function() {
      INP.setSelectionRange(caretPosition, caretPosition);
    }, 0);
  };
  StorkTagsInput.prototype.destroy = function destroy() {
    this._emptyEventListeners();
    while (this.tagsInput.firstChild) {
      this.tagsInput.removeChild(this.tagsInput.firstChild);
    }
    while (this.dropdownContainer.firstChild) {
      this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
    }
    this.dropdownContainer.parentNode.removeChild(this.dropdownContainer);
    this.tagsInput.classList.remove("stork-tags", "stork-tags" + this.rnd);
    delete this.tagsInput;
    delete this.inputMinWidth;
    delete this.rechooseRemove;
    delete this.placeholder;
    delete this.chosenTags;
    delete this.focusedTagIndex;
    delete this.lastSearchString;
    delete this.tagDeleteThrottle;
    delete this.eventListeners;
  };
  root.StorkTagsInput = StorkTagsInput;
})(window);