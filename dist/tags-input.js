if (!Number.isInteger) {
  Number.isInteger = function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
  };
}

(function(root) {
  "use strict";
  var keyboardMap = [ "", "", "", "CANCEL", "", "", "HELP", "", "BACKSPACE", "TAB", "", "", "CLEAR", "ENTER", "ENTER_SPECIAL", "", "SHIFT", "CONTROL", "ALT", "PAUSE", "CAPS_LOCK", "KANA", "EISU", "JUNJA", "FINAL", "HANJA", "", "ESCAPE", "CONVERT", "NONCONVERT", "ACCEPT", "MODECHANGE", "SPACE", "PAGE_UP", "PAGE_DOWN", "END", "HOME", "LEFT", "UP", "RIGHT", "DOWN", "SELECT", "PRINT", "EXECUTE", "PRINTSCREEN", "INSERT", "DELETE", "", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "COLON", "SEMICOLON", "LESS_THAN", "EQUALS", "GREATER_THAN", "QUESTION_MARK", "AT", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "OS_KEY", "", "CONTEXT_MENU", "", "SLEEP", "NUMPAD0", "NUMPAD1", "NUMPAD2", "NUMPAD3", "NUMPAD4", "NUMPAD5", "NUMPAD6", "NUMPAD7", "NUMPAD8", "NUMPAD9", "MULTIPLY", "ADD", "SEPARATOR", "SUBTRACT", "DECIMAL", "DIVIDE", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24", "", "", "", "", "", "", "", "", "NUM_LOCK", "SCROLL_LOCK", "WIN_OEM_FJ_JISHO", "WIN_OEM_FJ_MASSHOU", "WIN_OEM_FJ_TOUROKU", "WIN_OEM_FJ_LOYA", "WIN_OEM_FJ_ROYA", "", "", "", "", "", "", "", "", "", "CIRCUMFLEX", "EXCLAMATION", "DOUBLE_QUOTE", "HASH", "DOLLAR", "PERCENT", "AMPERSAND", "UNDERSCORE", "OPEN_PAREN", "CLOSE_PAREN", "ASTERISK", "PLUS", "PIPE", "HYPHEN_MINUS", "OPEN_CURLY_BRACKET", "CLOSE_CURLY_BRACKET", "TILDE", "", "", "", "", "VOLUME_MUTE", "VOLUME_DOWN", "VOLUME_UP", "", "", "SEMICOLON", "EQUALS", "COMMA", "MINUS", "PERIOD", "SLASH", "BACK_QUOTE", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "OPEN_BRACKET", "BACK_SLASH", "CLOSE_BRACKET", "QUOTE", "", "META", "ALTGR", "", "WIN_ICO_HELP", "WIN_ICO_00", "", "WIN_ICO_CLEAR", "", "", "WIN_OEM_RESET", "WIN_OEM_JUMP", "WIN_OEM_PA1", "WIN_OEM_PA2", "WIN_OEM_PA3", "WIN_OEM_WSCTRL", "WIN_OEM_CUSEL", "WIN_OEM_ATTN", "WIN_OEM_FINISH", "WIN_OEM_COPY", "WIN_OEM_AUTO", "WIN_OEM_ENLW", "WIN_OEM_BACKTAB", "ATTN", "CRSEL", "EXSEL", "EREOF", "PLAY", "ZOOM", "", "PA1", "WIN_OEM_CLEAR", "" ];
  var getPosition = function getPosition(elm) {
    var xPos = 0;
    var yPos = 0;
    while (elm) {
      xPos += elm.offsetLeft;
      yPos += elm.offsetTop;
      elm = elm.offsetParent;
    }
    return {
      x: xPos,
      y: yPos
    };
  };
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
    var xy = getPosition(this.tagsInput);
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
    li.storkTagsProps = {
      index: this.chosenTags.length - 1
    };
    li.appendChild(xA);
    li.appendChild(textSpan);
    this.ul.insertBefore(li, this.input.parentNode);
  };
  storkTagsInput.prototype.removeTag = function removeTag(index) {
    if (this.chosenTags[index]) {
      if (Number.isInteger(this.focusedTagIndex)) {
        this.chosenTags[this.focusedTagIndex].elm.classList.remove("focused");
      }
      this.focusedTagIndex = null;
      this.chosenTags[index].elm.parentNode.removeChild(this.chosenTags[index].elm);
      this.chosenTags.splice(index, 1);
      return true;
    }
    return false;
  };
  storkTagsInput.prototype.onClickTag = function onClickTag(e) {
    var elm = e.target, i = 0;
    do {
      if (elm.tagName.toUpperCase() === "A" && elm.classList.contains("remove")) {
        this.removeTag(elm.parentNode.storkTagsProps.index);
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
      for (var i = 0; i < this.ul.childNodes.length; i++) {
        if (index === this.ul.childNodes[i]) {
          index = this.ul.childNodes[i].storkTagsProps.index;
          break;
        }
      }
      if (!Number.isInteger(index)) {
        console.error("Invalid element passed to tags onClick");
        return;
      }
    }
    if (Number.isInteger(this.focusedTagIndex)) {
      this.chosenTags[this.focusedTagIndex].elm.classList.remove("focused");
    }
    this.chosenTags[index].elm.classList.add("focused");
    this.focusedTagIndex = index;
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
    if (key === "LEFT" || key === "RIGHT") {
      e.preventDefault();
      if (key === "LEFT") {
        if (!Number.isInteger(this.focusedTagIndex) || this.focusedTagIndex === 0) {
          this.onClickFocusTag(this.chosenTags.length - 1);
        } else {
          this.onClickFocusTag(this.focusedTagIndex - 1);
        }
      } else if (key === "RIGHT") {
        if (!Number.isInteger(this.focusedTagIndex) || this.focusedTagIndex === this.chosenTags.length - 1) {
          this.onClickFocusTag(0);
        } else {
          this.onClickFocusTag(this.focusedTagIndex + 1);
        }
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
  root.storkTagsInput = storkTagsInput;
})(this);