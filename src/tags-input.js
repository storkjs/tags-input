(function(root) {
	"use strict";
	/**
	 * construct for the StorkJS Tags Input.
	 * this initializes all of the variable and then starts the DOM build up process
	 * @param options
	 */
	var storkTagsInput = function storkTagsInput(options) {
		this.tagsInput = options.element;
		this.suggestionsHandler = options.suggestionsHandler;
		if(!this.rnd) {
			this.rnd = (Math.floor(Math.random() * 9) + 1) * 1000 + Date.now() % 1000; // random identifier for this grid
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
		this.tagsMaxScrollLeft = 0;

		this.tagsInput.classList.add('stork-tags', 'stork-tags'+this.rnd);
		this.tagsInput.setAttribute('tabindex', 0);

		this.buildDom();
		this.updateScrollAndWidths();

		this.setEventListeners();
	};

	/**
	 * a function for passing an addEventListener from the grid-instance to the grid-dom-element
	 * @param type
	 * @param listener
	 * @param [options_or_useCapture]
	 */
	storkTagsInput.prototype.addEventListener = function customAddEventListener(type, listener, options_or_useCapture) {
		this.tagsInput.addEventListener(type, listener, options_or_useCapture);
	};

	storkTagsInput.prototype.buildDom = function buildDom() {
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

	storkTagsInput.prototype.setEventListeners = function setEventListeners() {
		// typing in search input
		this.input.addEventListener('keyup', this.onChangeSearchInput.bind(this), false);

		// focusing on the search input
		this.input.addEventListener('focus', this.onFocusSearchInput.bind(this), false);

		// choosing from suggestions dropdown list
		this.dropdownContainer.addEventListener('click', this.onClickSuggestionsDropdown.bind(this), false);

		// focusing on suggestions items
		this.dropdownContainer.addEventListener('mousemove', this.onMouseMoveSuggestionsDropdown.bind(this), false);

		// handle clicking on tags (for focus or removal)
		this.ul.addEventListener('click', this.onClickTag.bind(this), false);

		// focus and blur of tagsInput
		document.addEventListener('click', this.onClickCheckFocus.bind(this), true);

		// suggestions up and down keyboard navigation
		this.tagsInput.addEventListener('keydown', this.onSuggestionsKeyboardNavigate.bind(this), false);
		this.dropdownContainer.addEventListener('keydown', this.onSuggestionsKeyboardNavigate.bind(this), false);

		// navigating the tags
		this.tagsInput.addEventListener('keydown', this.onTagsKeyboardNavigate.bind(this), false);
	};

	/**
	 * set the position of the dropdown to be just under the tags input.
	 * use this in case the window was resized or when tags-input changed its position
	 * @param {number} [width]
	 */
	storkTagsInput.prototype.positionDropdown = function positionDropdown(width) {
		if(!width) {
			this.dropdownContainer.style.width = this.tagsInput.offsetWidth + 'px';
		} else {
			this.dropdownContainer.style.width = width + 'px';
		}

		var coordinates = this.tagsInput.getCoordinates();
		this.dropdownContainer.style.left = coordinates.x + 'px';
		this.dropdownContainer.style.top = (coordinates.y + this.tagsInput.offsetHeight + 1) + 'px';
	};

	storkTagsInput.prototype.suggestionsCallback = function suggestionsCallback(suggestionsArr) {
		if(suggestionsArr.length === 0) {
			this.dropdownContainer.classList.remove('has-results');
			return;
		}

		// empty the dropdown's previous content
		while(this.dropdownContainer.firstChild) {
			this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
		}

		var i, j, groupDiv, groupHeader, itemsList, item, miscElm;

		for(i=0; i < suggestionsArr.length; i++) {
			groupDiv = document.createElement('div');
			groupHeader = document.createElement('div');
			miscElm = document.createElement('span');
			itemsList = document.createElement('ul');

			miscElm.appendChild(document.createTextNode(suggestionsArr[i].displayName));
			groupHeader.appendChild(miscElm);

			for(j=0; j < suggestionsArr[i].items.length; j++) {
				item = document.createElement('li');
				item.storkTagsProps = {
					value: suggestionsArr[i].items[j].value,
					displayName: suggestionsArr[i].items[j].displayName,
					groupId: suggestionsArr[i].id,
					groupDisplayName: suggestionsArr[i].displayName
				};
				miscElm = document.createElement('a');
				miscElm.appendChild(document.createTextNode(suggestionsArr[i].items[j].displayName));
				item.appendChild(miscElm);
				itemsList.appendChild(item);
			}

			groupDiv.appendChild(groupHeader);
			groupDiv.appendChild(itemsList);
			this.dropdownContainer.appendChild(groupDiv);
		}

		this.dropdownContainer.storkTagsProps.hoveredLIIndex = null; // allLIs was just re-built so let's forget the previously hovered item

		this.dropdownContainer.classList.add('has-results'); // open the dropdown
	};

	storkTagsInput.prototype.onClickSuggestionsDropdown = function onClickSuggestionsDropdown(e) {
		var LI = e.target,
			i = 0;

		while(!(LI instanceof HTMLDocument) && LI.tagName.toUpperCase() !== 'LI') {
			if(i++ >= 2) {
				return; // user clicked on something that is too far from our A tag
			}
			LI = LI.parentNode;
		}

		this.addTag(LI.storkTagsProps);

		this.input.value = '';
		this.input.focus();
		this.onChangeSearchInput();
	};

	storkTagsInput.prototype.onMouseMoveSuggestionsDropdown = function onMouseMoveSuggestionsDropdown(e) {
		var LI = e.target,
			i = 0;

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
				break;
			}
		}
	};

	storkTagsInput.prototype.addTag = function addTag(tagObj) {
		var i;

		for(i=0; i < this.chosenTags.length; i++) {
			if(tagObj.groupId === this.chosenTags[i].groupId && tagObj.value === this.chosenTags[i].value) {
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
		groupSpan.appendChild(document.createTextNode(tagObj.groupDisplayName));
		valueSpan.appendChild(document.createTextNode(tagObj.displayName));

		xA.classList.add('remove');
		groupSpan.classList.add('group');
		valueSpan.classList.add('value');

		this.chosenTags.push({
			value: tagObj.value,
			displayName: tagObj.displayName,
			groupId: tagObj.groupId,
			groupDisplayName: tagObj.groupDisplayName,
			elm: li
		});

		li.appendChild(xA);
		li.appendChild(groupSpan);
		li.appendChild(valueSpan);
		this.ul.appendChild(li);

		this.updateScrollAndWidths();

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

	storkTagsInput.prototype.removeTag = function removeTag(index) {
		if(this.chosenTags[index]) {
			this.unfocusTags(); // unselect a focused tag

			// remove tag from tags list
			this.ul.removeChild(this.chosenTags[index].elm);
			var removed = this.chosenTags.splice(index, 1);

			this.updateScrollAndWidths();

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

	storkTagsInput.prototype.updateScrollAndWidths = function updateScrollAndWidths() {
		var ulStyle = this.ul.currentStyle || window.getComputedStyle(this.ul);
		var ulWidth = parseInt(ulStyle.width) - parseInt(ulStyle.paddingRight);

		var containerWidth = this.tagsInput.clientWidth; // excluding borders
		var remainingWidth = containerWidth - ulWidth;
		var inputWidth = Math.max(remainingWidth, this.inputMinWidth);

		this.input.style.width = inputWidth + 'px';
		this.ul.style.paddingRight = inputWidth + 'px';

		this.tagsMaxScrollLeft = ulWidth + inputWidth - containerWidth;
		this.tagsInput.scrollLeft = this.tagsMaxScrollLeft; // maximum scroll so we'll see the search input on the right
		this.input.style.right = -this.tagsMaxScrollLeft + 'px';
	};

	storkTagsInput.prototype.onClickTag = function onClickTag(e) {
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

	storkTagsInput.prototype.onClickFocusTag = function onClickFocusTag(index) {
		if(!Number.isInteger(index)) { // we have got an element object instead of its index
			index = index.index;
		}

		if(Number.isInteger(this.focusedTagIndex)) {
			this.chosenTags[this.focusedTagIndex].elm.classList.remove('focused');
		}

		this.chosenTags[index].elm.classList.add('focused');
		this.focusedTagIndex = index;
		this.tagsInput.focus(); // blurs the search input, but keeps focus on the component

		var liStyle = this.chosenTags[index].elm.currentStyle || window.getComputedStyle(this.chosenTags[index].elm);
		var marginLeft = parseInt(liStyle.marginLeft);
		this.tagsInput.scrollLeft = Math.min(this.chosenTags[index].elm.offsetLeft - marginLeft, this.tagsMaxScrollLeft);
		this.input.style.right = -this.tagsInput.scrollLeft + 'px';
	};

	storkTagsInput.prototype.onClickCheckFocus = function onClickCheckFocus(e) {
		var target = e.target;

		while(!(target instanceof HTMLDocument) && target !== this.tagsInput && target !== this.dropdownContainer) {
			target = target.parentNode;

			if(target && target instanceof HTMLDocument) { // our loop reached 'document' element, meaning user clicked outside of the component
				this.tagsInput.classList.remove('focused');
				this.dropdownContainer.classList.remove('focused');
				return;
			}
		}

		this.tagsInput.classList.add('focused');
		this.dropdownContainer.classList.add('focused');
	};

	storkTagsInput.prototype.onChangeSearchInput = function onChangeSearchInput(e) {
		if(this.input.value !== this.lastSearchString) {
			this.suggestionsHandler(this.input.value, this.chosenTags, this.suggestionsCallback.bind(this));
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

	storkTagsInput.prototype.onTagsKeyboardNavigate = function onTagsKeyboardNavigate(e) {
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

	storkTagsInput.prototype.unfocusSuggestions = function unfocusSuggestions() {
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

	storkTagsInput.prototype.unfocusTags = function unfocusTags() {
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

	storkTagsInput.prototype.focusSearchInput = function focusSearchInput(caretPosition) {
		if(!Number.isInteger(caretPosition)) {
			caretPosition = 0;
		}
		this.input.focus();
		var INP = this.input;
		setTimeout(function() { // fixes a bug where inputs caret doesn't move and/or text doesn't really get selected
			INP.setSelectionRange(caretPosition, caretPosition);
		}, 0);
	};

	root.storkTagsInput = storkTagsInput;
})(window); // main scope we are running at (if 'this' is passed then we will be compatible with node 'module.reports' style)