(function(root) {
	"use strict";

	/**
	 * capitalize first letter of every word and the rest is lowercased
	 * @param str
	 * @returns {*}
	 */
	var capitalizeWords = function capitalizeWords(str) {
		return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	};

	/**
	 * construct for the StorkJS Tags Input.
	 * this initializes all of the variable and then starts the DOM build up process
	 * @param options
	 */
	var StorkTagsInput = function StorkTagsInput(options) {
		this.tagsInput = options.element;
		this.suggestionsHandler = options.suggestionsHandler;
		if(!this.rnd) {
			this.rnd = (Math.floor(Math.random() * 9) + 1) * 1000 + Date.now() % 1000; // random identifier for this tags instance
		}
		this.inputMinWidth = options.inputMinWidth || 60;
		this.rechooseRemove = options.rechooseRemove || false;
		this.placeholder = options.placeholder || '';

		this.chosenTags = [];
		this.focusedTagIndex = null;
		this.lastSearchString = '';
		this.tagDeleteThrottle = {
			allowed: true, // a throttle to prevent accidentally deleting tags when deleting text from the search input
			TO: undefined // timeout
		};
		this.eventListeners = [];

		this.tagsInput.classList.add('stork-tags', 'stork-tags'+this.rnd);
		this.tagsInput.setAttribute('tabindex', 0);

		this.buildDom();

		this.setEventListeners();
	};

	/**
	 * CUSTOM addEventListener method. this method keeps track of listeners so we can later do removeEventListener
	 * (for example on destroy()) and prevent memory leaks.
	 * @param element
	 * @param type
	 * @param listener
	 * @param options_or_useCapture
	 * @private
	 */
	StorkTagsInput.prototype._addEventListener = function customAddEventListener(element, type, listener, options_or_useCapture) {
		element.addEventListener(type, listener, options_or_useCapture); // add event listener

		this.eventListeners.push({element: element, type: type, listener: listener, options: options_or_useCapture}); // save listeners parameters

		return this.eventListeners.length - 1; // return index for removing this specific listener later
	};

	/**
	 * remove a specific event listener by its index
	 * @param index
	 * @private
	 */
	StorkTagsInput.prototype._removeEventListener = function customRemoveEventListener(index) {
		var currEL = this.eventListeners[index];
		if(currEL) { // if this event wasn't removed before
			currEL.element.removeEventListener(currEL.type, currEL.listener, currEL.options);
		}
		this.eventListeners[index] = null; // change value instead of popping it out because we don't want to change the indexes of others in this list
	};

	/**
	 * remove all event listeners from all of the tags's dom elements and empty the listeners array
	 * @private
	 */
	StorkTagsInput.prototype._emptyEventListeners = function emptyEventListeners() {
		var currEL;

		for(var i=0; i < this.eventListeners.length; i++) {
			currEL = this.eventListeners[i];

			if(currEL) {
				this._removeEventListener(i);
			}
		}
	};

	/**
	 * a function for passing an addEventListener from the tags-instance to the tags-dom-element
	 * @param type
	 * @param listener
	 * @param [options_or_useCapture]
	 */
	StorkTagsInput.prototype.addEventListener = function customAddEventListener(type, listener, options_or_useCapture) {
		this._addEventListener(this.tagsInput, type, listener, options_or_useCapture, true);
	};

	/**
	 * a function for passing a removeEventListener from the tags-instance to the tags-dom-element
	 * @param type
	 * @param listener
	 * @param [options_or_useCapture]
	 */
	StorkTagsInput.prototype.removeEventListener = function customRemoveEventListener(type, listener, options_or_useCapture) {
		this.tagsInput.removeEventListener(type, listener, options_or_useCapture);

		for(var i=0; i < this.eventListeners.length; i++) {
			if(this.eventListeners[i].element === this.tagsInput
				&& this.eventListeners[i].type === type
				&& this.eventListeners[i].listener === listener) {
				this.eventListeners[i] = null;
			}
		}
	};

	StorkTagsInput.prototype.buildDom = function buildDom() {
		var ul = document.createElement('ul');
		var input = document.createElement('input');

		input.classList.add('search');
		input.setAttribute('placeholder', this.placeholder);

		this.tagsInput.appendChild(ul);
		this.tagsInput.appendChild(input);

		var dropdownContainer = document.createElement('div');
		dropdownContainer.classList.add('stork-tags-dropdown-container', 'stork-tags-dropdown-container'+this.rnd);
		dropdownContainer.setAttribute('tabindex', 0);

		this.ul = ul;
		this.input = input;
		this.dropdownContainer = dropdownContainer;
		this.dropdownContainer.storkTagsProps = {
			allLIs: this.dropdownContainer.getElementsByTagName('li'),/*now hold a live HTMLCollection*/
			hoveredLIIndex: null
		};

		this.positionDropdown();

		document.body.appendChild(dropdownContainer);
	};

	StorkTagsInput.prototype.setEventListeners = function setEventListeners() {
		// typing in search input
		this._addEventListener(this.input, 'keyup', this.onChangeSearchInput.bind(this), false);

		// focusing on the search input
		this._addEventListener(this.input, 'focus', this.onFocusSearchInput.bind(this), false);

		// choosing from suggestions dropdown list
		this._addEventListener(this.dropdownContainer, 'click', this.onClickSuggestionsDropdown.bind(this), false);

		// focusing on suggestions items
		this._addEventListener(this.dropdownContainer, 'mousemove', this.onMouseMoveSuggestionsDropdown.bind(this), false);

		// handle clicking on tags (for focus or removal)
		this._addEventListener(this.ul, 'click', this.onClickTag.bind(this), false);

		// focus and blur of tagsInput
		this._addEventListener(document, 'click', this.onClickCheckFocus.bind(this), true);

		// suggestions up and down keyboard navigation
		this._addEventListener(this.tagsInput, 'keydown', this.onSuggestionsKeyboardNavigate.bind(this), false);
		this._addEventListener(this.dropdownContainer, 'keydown', this.onSuggestionsKeyboardNavigate.bind(this), false);

		// navigating the tags
		this._addEventListener(this.tagsInput, 'keydown', this.onTagsKeyboardNavigate.bind(this), false);
	};

	/**
	 * set the position of the dropdown to be just under the tags input.
	 * use this in case the window was resized or when tags-input changed its position
	 * @param {number} [width]
	 */
	StorkTagsInput.prototype.positionDropdown = function positionDropdown(width) {
		if(!width) {
			this.dropdownContainer.style.width = this.tagsInput.offsetWidth + 'px';
		} else {
			this.dropdownContainer.style.width = width + 'px';
		}

		var coordinates = this.tagsInput.getCoordinates();
		this.dropdownContainer.style.left = coordinates.x + 'px';
		this.dropdownContainer.style.top = (coordinates.y + this.tagsInput.offsetHeight + 1) + 'px';
	};

	StorkTagsInput.prototype.suggestionsCallback = function suggestionsCallback(suggestionsArr) {
		// empty the dropdown's previous content
		while(this.dropdownContainer.firstChild) {
			this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
		}

		if(suggestionsArr.length === 0) {
			this.dropdownContainer.classList.remove('has-results');
			return;
		}

		// build new suggestions dom
		var i, j, groupDiv, groupHeader, itemsList, item, miscElm;

		for(i=0; i < suggestionsArr.length; i++) {
			groupDiv = document.createElement('div');
			groupHeader = document.createElement('div');
			miscElm = document.createElement('span');
			itemsList = document.createElement('ul');

			miscElm.appendChild(document.createTextNode(suggestionsArr[i].label));
			groupHeader.appendChild(miscElm);

			for(j=0; j < suggestionsArr[i].items.length; j++) {
				item = document.createElement('li');
				item.storkTagsProps = {
					value: suggestionsArr[i].items[j].value,
					label: suggestionsArr[i].items[j].label,
					groupField: suggestionsArr[i].field,
					groupLabel: suggestionsArr[i].label
				};
				miscElm = document.createElement('a');
				miscElm.appendChild(document.createTextNode(suggestionsArr[i].items[j].label));
				item.appendChild(miscElm);
				itemsList.appendChild(item);
			}

			groupDiv.appendChild(groupHeader);
			groupDiv.appendChild(itemsList);
			this.dropdownContainer.appendChild(groupDiv);
		}

		this.dropdownContainer.storkTagsProps.hoveredLIIndex = null; // allLIs was just re-built so let's forget the previously hovered item (and re-select on the next line)
		this.onMouseMoveSuggestionsDropdown({ target: this.dropdownContainer.storkTagsProps.allLIs[0] }); // choose the first items

		this.positionDropdown();
		this.dropdownContainer.classList.add('has-results'); // open the dropdown
	};

	StorkTagsInput.prototype.onClickSuggestionsDropdown = function onClickSuggestionsDropdown(e) {
		var LI = e.target,
			i = 0;

		while(!(LI instanceof HTMLDocument) && LI.tagName.toUpperCase() !== 'LI') {
			if(i++ >= 2) {
				return; // user clicked on something that is too far from our A tag
			}
			LI = LI.parentNode;
		}

		this.addTag(LI.storkTagsProps);
		this.unfocusSuggestions();

		this.input.value = '';
		this.input.focus();
		this.onFocusSearchInput();
		this.onChangeSearchInput();
	};

	/**
	 * calculate scrolling position of suggestion dropdown menu when nevigating between items
	 */
	StorkTagsInput.prototype._scrollSuggestionsDropdownByItem = function _scrollSuggestionsDropdownByItem(LI) {
		var yPos = 0, yPos_bottomPart, elm = LI;

		while (elm && elm !== this.dropdownContainer && this.dropdownContainer.contains(elm)) {
			yPos += elm.offsetTop;

			elm = elm.offsetParent;
		}

		if(yPos < this.dropdownContainer.scrollTop) {
			this.dropdownContainer.scrollTop = yPos;
		}
		else {
			yPos_bottomPart = yPos + LI.clientHeight;
			if(this.dropdownContainer.scrollTop + this.dropdownContainer.clientHeight < yPos_bottomPart) {
				this.dropdownContainer.scrollTop = yPos_bottomPart - this.dropdownContainer.clientHeight;
			}
		}
	};

	StorkTagsInput.prototype.onMouseMoveSuggestionsDropdown = function onMouseMoveSuggestionsDropdown(e) {
		var LI = e.target,
			i = 0,
			self = this;

		if(!LI || !LI.tagName) {
			console.error('event\'s target is not an HTMLElement');
			return;
		}

		while(!(LI instanceof HTMLDocument) && LI.tagName.toUpperCase() !== 'LI') {
			if(i++ >= 2) {
				return; // user clicked on something that is too far from our A tag
			}
			LI = LI.parentNode;
		}

		var index = this.dropdownContainer.storkTagsProps.hoveredLIIndex;

		if(Number.isInteger(index)) {
			var prevHoveredLI = this.dropdownContainer.storkTagsProps.allLIs[index];
			if(prevHoveredLI === LI) { // haven't moved the mouse from one LI to another
				return;
			}

			prevHoveredLI.classList.remove('focused');
		}

		for(i=0; i < this.dropdownContainer.storkTagsProps.allLIs.length; i++) {
			if(LI === this.dropdownContainer.storkTagsProps.allLIs[i]) {
				LI.classList.add('focused');
				this.dropdownContainer.storkTagsProps.hoveredLIIndex = i;

				//correct scroll position of suggestions-dropdown if needed.
				//run on next frame so the elements will render
				window.requestAnimationFrame(function() {
					self._scrollSuggestionsDropdownByItem(LI);
				});

				break;
			}
		}
	};

	StorkTagsInput.prototype.addTag = function addTag(tagObj) {
		var i;

		if(!tagObj.groupLabel) { tagObj.groupLabel = capitalizeWords(tagObj.groupField); }
		if(!tagObj.label) { tagObj.label = capitalizeWords(tagObj.value); }

		for(i=0; i < this.chosenTags.length; i++) {
			if(tagObj.groupField === this.chosenTags[i].groupField && tagObj.value === this.chosenTags[i].value) {
				if(this.rechooseRemove) {
					return this.removeTag(i); // remove already chosen tag
				}

				return false; // fail to add tag since tag already exists
			}
		}

		var li = document.createElement('li');
		var xA = document.createElement('a');
		var groupSpan = document.createElement('span');
		var valueSpan = document.createElement('span');

		xA.appendChild(document.createTextNode('×'));
		groupSpan.appendChild(document.createTextNode(tagObj.groupLabel));
		valueSpan.appendChild(document.createTextNode(tagObj.label));

		xA.classList.add('remove');
		groupSpan.classList.add('group');
		valueSpan.classList.add('value');

		this.chosenTags.push({
			value: tagObj.value,
			label: tagObj.label,
			groupField: tagObj.groupField,
			groupLabel: tagObj.groupLabel,
			elm: li
		});

		li.appendChild(xA);
		li.appendChild(groupSpan);
		li.appendChild(valueSpan);
		this.ul.appendChild(li);

		this.input.setAttribute('placeholder', ''); //having chosen tags is like having text in the input, so no placeholder should be shown

		var evnt = new CustomEvent('tag-added', {
			bubbles: true,
			cancelable: true,
			detail: {
				obj: this.chosenTags[this.chosenTags.length - 1],
				index: this.chosenTags.length - 1
			}
		});
		this.tagsInput.dispatchEvent(evnt);
	};

	/**
	 * removes a specific tag, from the chosen tags list, in the given index
	 * @param index
	 * @returns {boolean}
	 */
	StorkTagsInput.prototype.removeTag = function removeTag(index) {
		if(this.chosenTags[index]) {
			this.unfocusTags(); // unselect a focused tag

			// remove tag from tags list
			this.ul.removeChild(this.chosenTags[index].elm);
			var removed = this.chosenTags.splice(index, 1);

			if(this.chosenTags.length === 0) {
				this.input.setAttribute('placeholder', this.placeholder); //no chosen tags so we should show the placeholder
			}

			var evnt = new CustomEvent('tag-removed', {
				bubbles: true,
				cancelable: true,
				detail: {
					obj: removed[0],
					index: index
				}
			});
			this.tagsInput.dispatchEvent(evnt);

			return true; // success
		}

		return false; // fail
	};

	/**
	 * completely clears the chosen tags list
	 * @returns {boolean}
	 */
	StorkTagsInput.prototype.removeAllTags = function removeAllTags() {
		this.unfocusTags(); // unselect a focused tag

		if(!this.ul.firstChild) {
			return false; // no need to remove a thing
		}

		// remove tags from tags list
		while(this.ul.firstChild) {
			this.ul.removeChild(this.ul.firstChild);
		}
		var removed = this.chosenTags.splice(0, this.chosenTags.length);

		if(this.chosenTags.length === 0) {
			this.input.setAttribute('placeholder', this.placeholder); //no chosen tags so we should show the placeholder
		}

		var evnt = new CustomEvent('all-tags-removed', {
			bubbles: true,
			cancelable: true,
			detail: {
				removedTags: removed
			}
		});
		this.tagsInput.dispatchEvent(evnt);

		return true; // success
	};

	/**
	 * when clicking a tag remove it or focus it
	 * @param e
	 */
	StorkTagsInput.prototype.onClickTag = function onClickTag(e) {
		var elm = e.target,
			i = 0;

		do {
			if(elm.tagName.toUpperCase() === 'A' && elm.classList.contains('remove')) {
				var elmIndex = elm.parentNode.index;
				this.removeTag(elmIndex);
				this.focusSearchInput(0);
				return;
			}
			else if(elm.tagName.toUpperCase() === 'LI') {
				this.onClickFocusTag(elm);
				return;
			}

			elm = elm.parentNode;
			i++;
		} while(i <= 3 && !(elm instanceof HTMLDocument));
	};

	StorkTagsInput.prototype.onClickFocusTag = function onClickFocusTag(index) {
		if(!Number.isInteger(index)) { // we have got an element object instead of its index
			index = index.index;
		}

		if(Number.isInteger(this.focusedTagIndex)) {
			this.chosenTags[this.focusedTagIndex].elm.classList.remove('focused');
		}

		this.chosenTags[index].elm.classList.add('focused');
		this.focusedTagIndex = index;
		this.tagsInput.focus(); // blurs the search input, but keeps focus on the component

		if(!this._tagLIMarginLeft) { //calculate the margin-left of LIs once
			var liStyle = this.chosenTags[index].elm.currentStyle || window.getComputedStyle(this.chosenTags[index].elm);
			this._tagLIMarginLeft = parseInt(liStyle.marginLeft);
		}

		var leftPos = this.chosenTags[index].elm.offsetLeft;
		var extra = 20; //show extra from the next tag (the one to the left of the current tag)
		this.tagsInput.scrollLeft = leftPos - this._tagLIMarginLeft - extra;
	};

	StorkTagsInput.prototype.onClickCheckFocus = function onClickCheckFocus(e) {
		var target = e.target,
			evnt;

		while(!(target instanceof HTMLDocument) && target !== this.tagsInput && target !== this.dropdownContainer) {
			target = target.parentNode;

			if(target && target instanceof HTMLDocument) { // our loop reached 'document' element, meaning user clicked outside of the component
				this.tagsInput.classList.remove('focused');
				this.dropdownContainer.classList.remove('focused');

				evnt = new CustomEvent('tags-input-blur', {
					bubbles: true,
					cancelable: true
				});
				this.tagsInput.dispatchEvent(evnt);

				return;
			}
		}

		this.tagsInput.classList.add('focused');
		this.dropdownContainer.classList.add('focused');

		evnt = new CustomEvent('tags-input-focus', {
			bubbles: true,
			cancelable: true
		});
		this.tagsInput.dispatchEvent(evnt);
	};

	StorkTagsInput.prototype.onChangeSearchInput = function onChangeSearchInput(e) {
		if(this.input.value !== this.lastSearchString) {
			this.suggestionsHandler(this.input.value, this.chosenTags, this.suggestionsCallback.bind(this));
		}

		this.lastSearchString = this.input.value;
	};

	StorkTagsInput.prototype.onFocusSearchInput = function onFocusSearchInput(e) {
		this.unfocusTags();
		this.tagsInput.scrollLeft = this.tagsInput.scrollWidth;
	};

	StorkTagsInput.prototype.onSuggestionsKeyboardNavigate = function onSuggestionsKeyboardNavigate(e) {
		var key = keyboardMap[e.keyCode];
		var hoveredIndex;
		var allLIs;

		if(this.dropdownContainer.storkTagsProps.allLIs.length === 0 || !this.dropdownContainer.classList.contains('focused')) {
			return;
		}

		if(key === 'DOWN' || key === 'UP' || key === 'ENTER') {
			e.preventDefault(); // stops document scrolling

			hoveredIndex = this.dropdownContainer.storkTagsProps.hoveredLIIndex;
			allLIs = this.dropdownContainer.storkTagsProps.allLIs;

			if(key === 'DOWN') {
				// first time selection on this list or trying to select over the end of the list
				if(!Number.isInteger(hoveredIndex) || hoveredIndex === allLIs.length - 1) {
					this.onMouseMoveSuggestionsDropdown({ target: allLIs[0] });
				}
				else {
					this.onMouseMoveSuggestionsDropdown({ target: allLIs[hoveredIndex + 1] });
				}
			}
			else if(key === 'UP') {
				// first time selection on this list or trying to select over the beginning of the list
				if(!Number.isInteger(hoveredIndex) || hoveredIndex === 0) {
					this.onMouseMoveSuggestionsDropdown({ target: allLIs[allLIs.length - 1] });
				}
				else {
					this.onMouseMoveSuggestionsDropdown({ target: allLIs[hoveredIndex - 1] });
				}
			}
			else if(key === 'ENTER') {
				if(Number.isInteger(hoveredIndex)) {
					this.onClickSuggestionsDropdown({ target: allLIs[hoveredIndex] });
				}
				else { // as a precaution, an enter when no item is selected first selects the first item
					this.onMouseMoveSuggestionsDropdown({ target: allLIs[0] });
				}
			}
		}
	};

	StorkTagsInput.prototype.onTagsKeyboardNavigate = function onTagsKeyboardNavigate(e) {
		var key = keyboardMap[e.keyCode];

		if(key === 'LEFT') {
			if(this.input === document.activeElement) {
				if(!Number.isInteger(this.focusedTagIndex) && this.input.selectionStart === 0) {
					this.onClickFocusTag(this.chosenTags.length - 1);
				}
			}
			else if(this.focusedTagIndex > 0) {
				this.onClickFocusTag(this.focusedTagIndex - 1);
				e.preventDefault(); // stops document scrolling
			}
		}
		else if(key === 'RIGHT') {
			if(this.input !== document.activeElement) {
				if(this.focusedTagIndex === this.chosenTags.length - 1) {
					this.unfocusTags();
					this.focusSearchInput(0);
				}
				else if(!Number.isInteger(this.focusedTagIndex)) {
					this.onClickFocusTag(0);
				}
				else {
					this.onClickFocusTag(this.focusedTagIndex + 1);
				}

				e.preventDefault(); // stops document scrolling
			}
		}
		else if(key === 'BACKSPACE' || key === 'DELETE') {
			if(this.input === document.activeElement) {
				if(this.tagDeleteThrottle.allowed && this.input.value === '') {
					this.removeTag(this.chosenTags.length - 1);
				}

				// for any delete we will throttle the option to delete a tag so user won't accidentally delete all tags when holding down DELETE key.
				// if user quickly taps the DELETE key then don't always reset the timeout when input is empty.
				if(this.input.value !== '' || this.tagDeleteThrottle.allowed) {
					this.tagDeleteThrottle.allowed = false; // disallow keyboard deleting
					clearTimeout(this.tagDeleteThrottle.TO);
					this.tagDeleteThrottle.TO = setTimeout((function() { this.tagDeleteThrottle.allowed = true; }).bind(this), 400);
				}
			}
			else if(Number.isInteger(this.focusedTagIndex)) {
				this.removeTag(this.focusedTagIndex);
				this.focusSearchInput(0);
				e.preventDefault(); // stops document scrolling
			}
		}
	};

	StorkTagsInput.prototype.unfocusSuggestions = function unfocusSuggestions() {
		if(Number.isInteger(this.dropdownContainer.storkTagsProps.hoveredLIIndex)) {
			this.dropdownContainer.storkTagsProps.allLIs[ this.dropdownContainer.storkTagsProps.hoveredLIIndex ].classList.remove('focused');
		}
		else { // brute force
			for(var i=0; i < this.dropdownContainer.storkTagsProps.allLIs.length; i++) {
				if(this.dropdownContainer.storkTagsProps.allLIs[i].classList.contains('focused')) {
					this.dropdownContainer.storkTagsProps.allLIs[i].classList.remove('focused');
				}
			}
		}

		this.dropdownContainer.storkTagsProps.hoveredLIIndex = null;
	};

	StorkTagsInput.prototype.unfocusTags = function unfocusTags() {
		if(Number.isInteger(this.focusedTagIndex)) {
			this.chosenTags[this.focusedTagIndex].elm.classList.remove('focused');
		}
		else { // brute force
			for(var i=0; i < this.chosenTags.length; i++) {
				if(this.chosenTags[i].elm.classList.contains('focused')) {
					this.chosenTags[i].elm.classList.remove('focused');
				}
			}
		}

		this.focusedTagIndex = null;
	};

	StorkTagsInput.prototype.focusSearchInput = function focusSearchInput(caretPosition) {
		if(!Number.isInteger(caretPosition)) {
			caretPosition = 0;
		}
		this.input.focus();
		var INP = this.input;
		setTimeout(function() { // fixes a bug where inputs caret doesn't move and/or text doesn't really get selected
			INP.setSelectionRange(caretPosition, caretPosition);
		}, 0);
	};

	/**
	 * completely destroy the tags - its DOM elements, methods and data
	 */
	StorkTagsInput.prototype.destroy = function destroy() {
		// remove event listeners
		this._emptyEventListeners();

		// remove dom elements
		while(this.tagsInput.firstChild) {
			this.tagsInput.removeChild(this.tagsInput.firstChild);
		}

		// remove properties
		this.tagsInput.classList.remove('stork-tags', 'stork-tags'+this.rnd);
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
})(window); // main scope we are running at (if 'this' is passed then we will be compatible with node 'module.reports' style)