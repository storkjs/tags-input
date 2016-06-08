(function(root) {
	"use strict";
	/**
	 * construct for the StorkJS Tags Input.
	 * this initializes all of the variable and then starts the DOM build up process
	 * @param options
	 */
	var storkTagsInput = function storkTagsInput(options) {
		this.tagsInput = options.element;
		if(!this.rnd) {
			this.rnd = (Math.floor(Math.random() * 9) + 1) * 1000 + Date.now() % 1000; // random identifier for this grid
		}
		this.chosenTags = [];

		this.makeList();

		this.tagsInput.classList.add('stork-tags', 'stork-tags'+this.rnd);
	};

	storkTagsInput.prototype.makeList = function makeList() {
		var ul = document.createElement('ul');
		var li = document.createElement('li');
		var input = document.createElement('input');

		li.classList.add('input-item');

		this.ul = ul;
		this.input = input;

		li.appendChild(input);
		ul.appendChild(li);
		this.tagsInput.appendChild(ul);
	};

	root.storkTagsInput = storkTagsInput;
})(this); // main scope we run at (should be 'window')