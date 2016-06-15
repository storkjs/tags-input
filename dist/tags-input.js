(function(root) {
  "use strict";
  var storkTagsInput = function storkTagsInput(options) {
    this.tagsInput = options.element;
    this.suggestionsHandler = options.suggestionsHandler;
    if (!this.rnd) {
      this.rnd = (Math.floor(Math.random() * 9) + 1) * 1e3 + Date.now() % 1e3;
    }
    this.rechooseRemove = options.rechooseRemove || false;
    this.chosenTagsFormat = options.chosenTagsFormat || "@@@ : ###";
    this.chosenTags = [];
    this.focusedTagIndex = null;
    this.lastSearchString = "";
    this.tagDeleteThrottle = {
      allowed: true,
      TO: undefined
    };
    this.tagsInput.classList.add("stork-tags", "stork-tags" + this.rnd);
    this.tagsInput.setAttribute("tabindex", 0);
    this.buildDom();
    this.setEventListeners();
    this.updateWidths();
  };
  storkTagsInput.prototype.buildDom = function buildDom() {
    var ul = document.createElement("ul");
    var li = document.createElement("li");
    var input = document.createElement("input");
    li.classList.add("search");
    li.appendChild(input);
    ul.appendChild(li);
    this.tagsInput.appendChild(ul);
    var dropdownContainer = document.createElement("div");
    dropdownContainer.classList.add("stork-tags-dropdown-container", "stork-tags-dropdown-container" + this.rnd);
    dropdownContainer.setAttribute("tabindex", 0);
    dropdownContainer.style.width = this.tagsInput.offsetWidth + "px";
    var xy = this.tagsInput.getCoordinates();
    dropdownContainer.style.left = xy.x + "px";
    dropdownContainer.style.top = xy.y + this.tagsInput.offsetHeight + 1 + "px";
    this.ul = ul;
    this.input = input;
    this.dropdownContainer = dropdownContainer;
    this.dropdownContainer.storkTagsProps = {
      allLIs: this.dropdownContainer.getElementsByTagName("li"),
      hoveredLIIndex: null
    };
    document.body.appendChild(dropdownContainer);
  };
  storkTagsInput.prototype.setEventListeners = function setEventListeners() {
    var self = this;
    this.input.addEventListener("keyup", this.onChangeSearchInput.bind(this), false);
    this.input.addEventListener("focus", this.onFocusSearchInput.bind(this), false);
    this.dropdownContainer.addEventListener("click", this.onClickSuggestionsDropdown.bind(this), false);
    this.dropdownContainer.addEventListener("mousemove", this.onMouseMoveSuggestionsDropdown.bind(this), false);
    this.ul.addEventListener("click", this.onClickTag.bind(this), false);
    document.addEventListener("click", this.onClickCheckFocus.bind(this), true);
    this.tagsInput.addEventListener("keydown", this.onSuggestionsKeyboardNavigate.bind(this), false);
    this.dropdownContainer.addEventListener("keydown", this.onSuggestionsKeyboardNavigate.bind(this), false);
    this.tagsInput.addEventListener("keydown", this.onTagsKeyboardNavigate.bind(this), false);
  };
  storkTagsInput.prototype.updateWidths = function updateWidths() {
    if (!this.maxWidth) {
      this.maxWidth = this.tagsInput.clientWidth;
    }
    this.input.parentNode.style.width = this.maxWidth + "px";
  };
  storkTagsInput.prototype.suggestionsCallback = function suggestionsCallback(suggestionsArr) {
    if (suggestionsArr.length === 0) {
      this.dropdownContainer.classList.remove("has-results");
      return;
    }
    while (this.dropdownContainer.firstChild) {
      this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
    }
    var i, j, groupDiv, groupHeader, itemsList, item, miscElm;
    for (i = 0; i < suggestionsArr.length; i++) {
      groupDiv = document.createElement("div");
      groupHeader = document.createElement("div");
      miscElm = document.createElement("span");
      itemsList = document.createElement("ul");
      miscElm.appendChild(document.createTextNode(suggestionsArr[i].displayName));
      groupHeader.appendChild(miscElm);
      for (j = 0; j < suggestionsArr[i].items.length; j++) {
        item = document.createElement("li");
        item.storkTagsProps = {
          value: suggestionsArr[i].items[j].value,
          displayName: suggestionsArr[i].items[j].displayName,
          groupId: suggestionsArr[i].id,
          groupDisplayName: suggestionsArr[i].displayName
        };
        miscElm = document.createElement("a");
        miscElm.appendChild(document.createTextNode(suggestionsArr[i].items[j].displayName));
        item.appendChild(miscElm);
        itemsList.appendChild(item);
      }
      groupDiv.appendChild(groupHeader);
      groupDiv.appendChild(itemsList);
      this.dropdownContainer.appendChild(groupDiv);
    }
    this.dropdownContainer.storkTagsProps.hoveredLIIndex = null;
    this.dropdownContainer.classList.add("has-results");
  };
  storkTagsInput.prototype.onClickSuggestionsDropdown = function onClickSuggestionsDropdown(e) {
    var LI = e.target, i = 0;
    while (!(LI instanceof HTMLDocument) && LI.tagName.toUpperCase() !== "LI") {
      if (i++ >= 2) {
        return;
      }
      LI = LI.parentNode;
    }
    this.addTag(LI.storkTagsProps);
    this.input.value = "";
    this.input.focus();
    this.onChangeSearchInput();
  };
  storkTagsInput.prototype.onMouseMoveSuggestionsDropdown = function onMouseMoveSuggestionsDropdown(e) {
    var LI = e.target, i = 0;
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
        break;
      }
    }
  };
  storkTagsInput.prototype.addTag = function addTag(tagObj) {
    var i;
    for (i = 0; i < this.chosenTags.length; i++) {
      if (tagObj.groupId === this.chosenTags[i].groupId && tagObj.value === this.chosenTags[i].value) {
        if (this.rechooseRemove) {
          return this.removeTag(i);
        }
        return false;
      }
    }
    var li = document.createElement("li");
    var xA = document.createElement("a");
    var textSpan = document.createElement("span");
    var displayText = this.chosenTagsFormat;
    displayText = displayText.replace(/@@@/g, tagObj.groupDisplayName);
    displayText = displayText.replace(/###/g, tagObj.displayName);
    xA.appendChild(document.createTextNode("×"));
    textSpan.appendChild(document.createTextNode(displayText));
    li.classList.add("tag");
    xA.classList.add("remove");
    this.chosenTags.push({
      value: tagObj.value,
      displayName: tagObj.displayName,
      groupId: tagObj.groupId,
      groupDisplayName: tagObj.groupDisplayName,
      elm: li
    });
    li.appendChild(xA);
    li.appendChild(textSpan);
    this.ul.insertBefore(li, this.input.parentNode);
    var evnt = new CustomEvent("tag-added", {
      bubbles: true,
      cancelable: true,
      detail: this.chosenTags[this.chosenTags.length - 1]
    });
    this.tagsInput.dispatchEvent(evnt);
  };
  storkTagsInput.prototype.removeTag = function removeTag(index) {
    if (this.chosenTags[index]) {
      this.unfocusTags();
      this.ul.removeChild(this.chosenTags[index].elm);
      this.chosenTags.splice(index, 1);
      return true;
    }
    return false;
  };
  storkTagsInput.prototype.onClickTag = function onClickTag(e) {
    var elm = e.target, i = 0;
    do {
      if (elm.tagName.toUpperCase() === "A" && elm.classList.contains("remove")) {
        var elmIndex = elm.index;
        this.removeTag(elmIndex);
        this.focusSearchInput(0);
        return;
      } else if (elm.tagName.toUpperCase() === "LI" && elm.classList.contains("tag")) {
        this.onClickFocusTag(elm);
        return;
      }
      elm = elm.parentNode;
      i++;
    } while (i <= 3 && !(elm instanceof HTMLDocument));
  };
  storkTagsInput.prototype.onClickFocusTag = function onClickFocusTag(index) {
    if (!Number.isInteger(index)) {
      index = index.index;
    }
    if (Number.isInteger(this.focusedTagIndex)) {
      this.chosenTags[this.focusedTagIndex].elm.classList.remove("focused");
    }
    this.chosenTags[index].elm.classList.add("focused");
    this.focusedTagIndex = index;
    this.tagsInput.focus();
  };
  storkTagsInput.prototype.onClickCheckFocus = function onClickCheckFocus(e) {
    var target = e.target;
    while (!(target instanceof HTMLDocument) && target !== this.tagsInput && target !== this.dropdownContainer) {
      target = target.parentNode;
      if (!target) {
        this.tagsInput.classList.remove("focused");
        this.dropdownContainer.classList.remove("focused");
        return;
      }
    }
    this.tagsInput.classList.add("focused");
    this.dropdownContainer.classList.add("focused");
  };
  storkTagsInput.prototype.onChangeSearchInput = function onChangeSearchInput(e) {
    if (this.input.value !== this.lastSearchString) {
      this.suggestionsHandler(this.input.value, this.suggestionsCallback.bind(this));
    }
    this.lastSearchString = this.input.value;
  };
  storkTagsInput.prototype.onFocusSearchInput = function onFocusSearchInput(e) {
    this.unfocusTags();
  };
  storkTagsInput.prototype.onSuggestionsKeyboardNavigate = function onSuggestionsKeyboardNavigate(e) {
    var key = keyboardMap[e.keyCode];
    var hoveredIndex;
    var allLIs;
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
      } else if (key === "ENTER" && Number.isInteger(hoveredIndex)) {
        this.onClickSuggestionsDropdown({
          target: allLIs[hoveredIndex]
        });
      }
    }
  };
  storkTagsInput.prototype.onTagsKeyboardNavigate = function onTagsKeyboardNavigate(e) {
    var key = keyboardMap[e.keyCode];
    if (key === "LEFT") {
      if (this.input === document.activeElement) {
        if (!Number.isInteger(this.focusedTagIndex) && this.input.selectionStart === 0) {
          this.onClickFocusTag(this.chosenTags.length - 1);
        }
      } else if (this.focusedTagIndex > 0) {
        this.onClickFocusTag(this.focusedTagIndex - 1);
        e.preventDefault();
      }
    } else if (key === "RIGHT") {
      if (this.input !== document.activeElement) {
        if (this.focusedTagIndex === this.chosenTags.length - 1) {
          this.unfocusTags();
          this.focusSearchInput(0);
        } else if (!Number.isInteger(this.focusedTagIndex)) {
          this.onClickFocusTag(0);
        } else {
          this.onClickFocusTag(this.focusedTagIndex + 1);
        }
        e.preventDefault();
      }
    } else if (key === "BACKSPACE" || key === "DELETE") {
      if (this.input === document.activeElement) {
        if (this.tagDeleteThrottle.allowed && this.input.value === "") {
          this.removeTag(this.chosenTags.length - 1);
        }
        if (this.input.value !== "" || this.tagDeleteThrottle.allowed) {
          this.tagDeleteThrottle.allowed = false;
          clearTimeout(this.tagDeleteThrottle.TO);
          this.tagDeleteThrottle.TO = setTimeout(function() {
            this.tagDeleteThrottle.allowed = true;
          }.bind(this), 400);
        }
      } else if (Number.isInteger(this.focusedTagIndex)) {
        this.removeTag(this.focusedTagIndex);
        this.focusSearchInput(0);
        e.preventDefault();
      }
    }
  };
  storkTagsInput.prototype.unfocusSuggestions = function unfocusSuggestions() {
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
  storkTagsInput.prototype.unfocusTags = function unfocusTags() {
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
  storkTagsInput.prototype.focusSearchInput = function focusSearchInput(caretPosition) {
    if (!Number.isInteger(caretPosition)) {
      caretPosition = 0;
    }
    this.input.focus();
    var INP = this.input;
    setTimeout(function() {
      INP.setSelectionRange(caretPosition, caretPosition);
    }, 0);
  };
  root.storkTagsInput = storkTagsInput;
})(this);