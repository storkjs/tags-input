(function(root) {
  "use strict";
  var storkTagsInput = function storkTagsInput(options) {
    this.tagsInput = options.element;
    if (!this.rnd) {
      this.rnd = (Math.floor(Math.random() * 9) + 1) * 1e3 + Date.now() % 1e3;
    }
    this.tagsInput.classList.add("stork-tags", "stork-tags" + this.rnd);
  };
  root.storkTagsInput = storkTagsInput;
})(this);