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
    this.maxlength = typeof options.maxlength === "number" ? options.maxlength : 50;
    this.maxTags = options.maxTags || 0;
    this.focused = false;
    this.chosenTags = [];
    this.focusedTagIndex = null;
    this.lastSearchString = null;
    this.tagDeleteThrottle = {
      allowed: true,
      TO: undefined
    };
    this.eventListeners = [];
    this.tagsInput.classList.add("stork-tags", "stork-tags" + this.rnd);
    this.tagsInput.setAttribute("tabindex", 0);
    this.buildDom();
    this.setEventListeners();
    if (!this.tagsInput.stork) {
      this.tagsInput.stork = {};
    }
    this.tagsInput.stork.tags = this;
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
      if (this.eventListeners[i] && this.eventListeners[i].element === this.tagsInput && this.eventListeners[i].type === type && this.eventListeners[i].listener === listener) {
        this.eventListeners[i] = null;
      }
    }
  };
  StorkTagsInput.prototype.buildDom = function buildDom() {
    this.ul = document.createElement("ul");
    this.inputLi = document.createElement("li");
    this.input = document.createElement("input");
    this.inputLi.classList.add("search-li");
    this.inputLi.storkTagsProps = {
      state: null
    };
    this.input.classList.add("search");
    this.input.storkTagsProps = {
      paddingLeft: 0,
      paddingRight: 0
    };
    this.input.setAttribute("placeholder", this.placeholder);
    if (this.maxlength > 0) {
      this.input.setAttribute("maxlength", this.maxlength);
    }
    this.inputLi.appendChild(this.input);
    this.ul.appendChild(this.inputLi);
    this.tagsInput.appendChild(this.ul);
    this.dropdownContainer = document.createElement("div");
    this.dropdownContainer.classList.add("stork-tags-dropdown-container", "stork-tags-dropdown-container" + this.rnd);
    this.dropdownContainer.setAttribute("tabindex", 0);
    this.dropdownContainer.storkTagsProps = {
      allLIs: this.dropdownContainer.getElementsByTagName("li"),
      hoveredLIIndex: null
    };
    this.updateSearchState();
    this.positionDropdown();
    document.body.appendChild(this.dropdownContainer);
  };
  StorkTagsInput.prototype.setEventListeners = function setEventListeners() {
    this._addEventListener(this.input, "keyup", this.onChangeSearchInput.bind(this), false);
    this._addEventListener(this.input, "keydown", this.onKeydownSearchInput.bind(this), false);
    this._addEventListener(this.input, "focus", this.onFocusSearchInput.bind(this), false);
    this._addEventListener(this.dropdownContainer, "click", this.onClickSuggestionsDropdown.bind(this), false);
    this._addEventListener(this.dropdownContainer, "mousemove", this.onMouseMoveSuggestionsDropdown.bind(this), false);
    this._addEventListener(this.ul, "click", this.onClickTagsArea.bind(this), false);
    this._addEventListener(document, "click", this.onClickCheckFocus.bind(this), true);
    this._addEventListener(document, "keyup", this.onKeyCheckFocus.bind(this), true);
    this._addEventListener(this.tagsInput, "keydown", this.onSuggestionsKeyboardNavigate.bind(this), false);
    this._addEventListener(this.dropdownContainer, "keydown", this.onSuggestionsKeyboardNavigate.bind(this), false);
    this._addEventListener(this.tagsInput, "keyup", this.onKeyboardFocus.bind(this), false);
    this._addEventListener(this.tagsInput, "keydown", this.onTagsKeyboardNavigate.bind(this), false);
    this._addEventListener(this.tagsInput, "keydown", this.onTagsESC.bind(this), false);
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
      if (suggestionsArr[i].label !== "") {
        miscElm.appendChild(document.createTextNode(suggestionsArr[i].label));
        groupHeader.appendChild(miscElm);
      }
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
    if (this.chosenTags.length >= 1) {
      this.suggestionsCallback([]);
      this.lastSearchString = "";
    }
    this.input.focus();
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
    if (this.maxTags > 0 && this.chosenTags.length >= this.maxTags) {
      console.info("Maximum tags in tags input reached (stork-tags" + this.rnd + ")");
      return false;
    }
    var i;
    if (typeof tagObj.groupLabel === "undefined" || tagObj.groupLabel === null) {
      tagObj.groupLabel = capitalizeWords(tagObj.groupField);
    }
    if (!tagObj.label) {
      tagObj.label = capitalizeWords(tagObj.value);
    }
    for (i = 0; i < this.chosenTags.length; i++) {
      if (tagObj.groupField === this.chosenTags[i].groupField && tagObj.value === this.chosenTags[i].value) {
        if (this.rechooseRemove) {
          try {
            this.removeTag(i);
          } catch (e) {
            return false;
          }
          return true;
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
    li.appendChild(xA);
    if (tagObj.groupLabel !== "") {
      li.appendChild(groupSpan);
    }
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
    this.updateSearchState();
    if (document.activeElement === this.input) {
      this.input.blur();
      this.input.focus();
    }
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
        this.lastSearchString = null;
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
    } else {
      throw new Error("index does not exist in chosenTags array");
    }
  };
  StorkTagsInput.prototype.removeAllTags = function removeAllTags() {
    this.unfocusTags();
    while (this.ul.firstChild) {
      this.ul.removeChild(this.ul.firstChild);
    }
    this.ul.appendChild(this.inputLi);
    var removed = this.chosenTags.splice(0, this.chosenTags.length);
    if (this.chosenTags.length === 0) {
      this.updateSearchState();
      this.lastSearchString = null;
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
  StorkTagsInput.prototype.onClickTagsArea = function onClickTagsArea(event) {
    var elm = event.target, i = 0;
    do {
      if (elm.tagName.toUpperCase() === "A" && elm.classList.contains("remove")) {
        var elmIndex = elm.parentNode.index;
        if (this.inputLi.index < elmIndex) {
          elmIndex--;
        }
        try {
          this.removeTag(elmIndex);
        } catch (e) {
          console.warn(e.message);
        } finally {
          this.focusSearchInput(0);
        }
        return;
      } else if (elm.tagName.toUpperCase() === "LI") {
        if (elm.classList.contains("tag")) {
          this.onClickFocusTag(elm);
        } else if (elm === this.inputLi) {
          this.input.focus();
        }
        return;
      } else if (elm.tagName.toUpperCase() === "UL") {
        this.redrawSearchInput(event.offsetX);
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
  StorkTagsInput.prototype.redrawSearchInput = function redrawSearchInput(x, caretPosition) {
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
    if (typeof caretPosition !== "number" && this.inputLi.offsetLeft < x) {
      caretPosition = this.input.value.length;
    }
    this.calculateSearchInputWidth();
    this.focusSearchInput(caretPosition);
  };
  StorkTagsInput.prototype.onClickCheckFocus = function onClickCheckFocus(e) {
    var target = e.target, evnt;
    while (!(target instanceof HTMLDocument) && target !== this.tagsInput && target !== this.dropdownContainer) {
      target = target.parentNode;
      if (target && target instanceof HTMLDocument) {
        if (this.focused) {
          this.focused = false;
          this.tagsInput.classList.remove("focused");
          this.dropdownContainer.classList.remove("focused");
          if (this.input.value === "") {
            this.lastSearchString = null;
          }
          evnt = new CustomEvent("tags-input-blur", {
            bubbles: true,
            cancelable: true
          });
          this.tagsInput.dispatchEvent(evnt);
        }
        return;
      }
    }
    if (!this.focused) {
      this.focused = true;
      this.tagsInput.classList.add("focused");
      this.dropdownContainer.classList.add("focused");
      evnt = new CustomEvent("tags-input-focus", {
        bubbles: true,
        cancelable: true
      });
      this.tagsInput.dispatchEvent(evnt);
    }
  };
  StorkTagsInput.prototype.onKeyCheckFocus = function onKeyCheckFocus(e) {
    this.onClickCheckFocus({
      target: document.activeElement
    });
  };
  StorkTagsInput.prototype.onChangeSearchInput = function onChangeSearchInput(e) {
    if (this.input.value !== this.lastSearchString) {
      if (this.inputLi.storkTagsProps.state === "with-tags") {
        this.calculateSearchInputWidth();
      }
      if (!this.maxTags || this.chosenTags.length < this.maxTags) {
        this.suggestionsHandler(this.input.value, this.chosenTags, this.suggestionsCallback.bind(this));
      }
    }
    this.lastSearchString = this.input.value;
  };
  StorkTagsInput.prototype.onKeydownSearchInput = function onKeydownSearchInput(event) {
    if (event.key && (event.keyCode >= 48 && event.keyCode <= 90) || event.keyCode >= 186 && event.keyCode <= 222) {
      if (this.inputLi.storkTagsProps.state === "with-tags") {
        this.calculateSearchInputWidth(this.input.value + event.key);
      }
    }
  };
  StorkTagsInput.prototype.calculateSearchInputWidth = function calculateSearchInputWidth(text) {
    if (this.inputLi.storkTagsProps.state === "no-tags") {
      this.input.style.width = "";
      return;
    }
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
    this.onChangeSearchInput();
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
        this.redrawSearchInput(this.chosenTags[this.focusedTagIndex].elm.offsetLeft - 1, this.input.value.length);
        e.preventDefault();
      }
    } else if (key === "RIGHT") {
      if (this.input === document.activeElement && this.inputLi.nextSibling && !Number.isInteger(this.focusedTagIndex) && this.input.selectionStart >= this.input.value.length) {
        this.onClickFocusTag(this.inputLi.nextSibling.index - 1);
      } else if (Number.isInteger(this.focusedTagIndex)) {
        this.redrawSearchInput(this.chosenTags[this.focusedTagIndex].elm.offsetLeft + this.chosenTags[this.focusedTagIndex].elm.clientWidth + 1, 0);
        e.preventDefault();
      }
    } else if (key === "BACKSPACE" || key === "DELETE") {
      if (this.input === document.activeElement) {
        if (this.tagDeleteThrottle.allowed && this.input.value === "") {
          try {
            if (key === "BACKSPACE" && this.inputLi.previousSibling) {
              this.removeTag(this.inputLi.previousSibling.index);
            } else if (key === "DELETE" && this.inputLi.nextSibling) {
              this.removeTag(this.inputLi.index);
            }
          } catch (e) {
            console.warn(e.message);
          }
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
        try {
          this.removeTag(tmpFocusedTagIndex);
        } catch (e) {
          console.warn(e.message);
        } finally {
          this.focusSearchInput(0);
        }
        e.preventDefault();
      }
    }
  };
  StorkTagsInput.prototype.onTagsESC = function onTagsESC(e) {
    var key = keyboardMap[e.keyCode];
    if (key === "ESCAPE") {
      this.dropdownContainer.classList.remove("focused");
    }
  };
  StorkTagsInput.prototype.onKeyboardFocus = function onKeyboardFocus(e) {
    var key = keyboardMap[e.keyCode];
    if (key === "TAB" && !e.shiftKey) {
      if (document.activeElement === this.tagsInput) {
        this.input.focus();
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
    INP.setSelectionRange(caretPosition, caretPosition);
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
    delete this.tagsInput.stork.tags;
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