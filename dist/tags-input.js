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
    this.chosenTags = [];
    this.tagsInput.classList.add("stork-tags", "stork-tags" + this.rnd);
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
    dropdownContainer.style.display = "none";
    dropdownContainer.style.width = this.tagsInput.offsetWidth + "px";
    var xy = getPosition(this.tagsInput);
    dropdownContainer.style.left = xy.x + "px";
    dropdownContainer.style.top = xy.y + this.tagsInput.offsetHeight + 1 + "px";
    this.ul = ul;
    this.input = input;
    this.dropdownContainer = dropdownContainer;
    document.body.appendChild(dropdownContainer);
  };
  storkTagsInput.prototype.setEventListeners = function setEventListeners() {
    var self = this;
    this.input.addEventListener("keypress", function(e) {}, false);
    this.input.addEventListener("keyup", function(e) {
      if (this.value.length) {
        self.suggestionsHandler(this.value, self.suggestionsCallback.bind(self));
      }
    }, false);
  };
  storkTagsInput.prototype.updateWidths = function updateWidths() {
    if (!this.maxWidth) {
      this.maxWidth = this.tagsInput.clientWidth;
    }
    this.input.parentNode.style.width = this.maxWidth + "px";
  };
  storkTagsInput.prototype.suggestionsCallback = function suggestionsCallback(suggestionsObj) {
    this.dropdownContainer.style.display = "block";
    while (this.dropdownContainer.firstChild) {
      this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
    }
    var i, j, groupDiv, groupHeader, itemsList, item, miscElm;
    for (i = 0; i < suggestionsObj.length; i++) {
      groupDiv = document.createElement("div");
      groupHeader = document.createElement("div");
      miscElm = document.createElement("span");
      itemsList = document.createElement("ul");
      miscElm.appendChild(document.createTextNode(suggestionsObj[i].displayName));
      groupHeader.appendChild(miscElm);
      for (j = 0; j < suggestionsObj[i].items.length; j++) {
        item = document.createElement("li");
        miscElm = document.createElement("a");
        miscElm.appendChild(document.createTextNode(suggestionsObj[i].items[j].displayName));
        item.appendChild(miscElm);
        itemsList.appendChild(item);
      }
      groupDiv.appendChild(groupHeader);
      groupDiv.appendChild(itemsList);
      this.dropdownContainer.appendChild(groupDiv);
    }
    console.log(suggestionsObj);
  };
  root.storkTagsInput = storkTagsInput;
})(this);