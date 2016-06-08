(function(root) {
  "use strict";
  var storkTagsInput = function storkTagsInput(options) {
    this.tagsInput = options.element;
    if (!this.rnd) {
      this.rnd = (Math.floor(Math.random() * 9) + 1) * 1e3 + Date.now() % 1e3;
    }
    this.chosenTags = [];
    this.makeList();
    this.tagsInput.classList.add("stork-tags", "stork-tags" + this.rnd);
  };
  storkTagsInput.prototype.makeList = function makeList() {
    var ul = document.createElement("ul");
    var li = document.createElement("li");
    var input = document.createElement("input");
    li.classList.add("input-item");
    this.ul = ul;
    this.input = input;
    li.appendChild(input);
    ul.appendChild(li);
    this.tagsInput.appendChild(ul);
  };
  root.storkTagsInput = storkTagsInput;
})(this);