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

		this.tagsInput.classList.add('stork-tags', 'stork-tags'+this.rnd);
	};

	root.storkTagsInput = storkTagsInput;
})(this); // main scope we run at (should be 'window')