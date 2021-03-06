(function (root) {
	"use strict";

	/**
	 * capitalize first letter of every word and the rest is lowercased
	 * @param str
	 * @returns {*}
	 */
	var capitalizeWords = function capitalizeWords(str) {
		return str.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	};

	/**
	 * construct for the StorkJS Tags Input.
	 * this initializes all of the variable and then starts the DOM build up process
	 * @param options
	 */
	var StorkTagsInput = function StorkTagsInput(options) {
		this.tagsInput = options.element;
		this.suggestionsHandler = options.suggestionsHandler;
		if (!this.rnd) {
			this.rnd = (Math.floor(Math.random() * 9) + 1) * 1000 + Date.now() % 1000; // random identifier for this tags instance
		}
		this.inputMinWidth = options.inputMinWidth || 60;
		this.rechooseRemove = options.rechooseRemove || false;
		this.multiValues = options.multiValues !== false;

		this.placeholder = options.placeholder || '';
		this.persistentPlaceholder = options.persistentPlaceholder || false;
		this.multiline = options.multiline || false;

		this.showGroups = options.showGroups !== false;

		this.textCanvasContext = null;
		this.maxlength = typeof options.maxlength === 'number' ? options.maxlength : 50;
		this.maxTags = options.maxTags || 0;
		this.persistentSuggestions = options.persistentSuggestions || false;

		this.focused = false;
		this.chosenTags = [];
		this.focusedTagIndex = null;
		this.lastSearchString = null; //initially not a string so it will trigger a search on an empty search (if the user wants to use that)
		this.tagDeleteThrottle = {
			allowed: true, // a throttle to prevent accidentally deleting tags when deleting text from the search input
			TO: undefined // timeout
		};
		this.eventListeners = [];

		this.tagsInput.classList.add('stork-tags', 'stork-tags' + this.rnd);
		if (this.multiline) {
			this.tagsInput.classList.add('multiline');
		}
		this.tagsInput.setAttribute('tabindex', 0);

		this.buildDom();

		var minWidth = 0;
		if (this.persistentPlaceholder) {
			minWidth = this.calculateSearchInputWidth(this.placeholder);
		}
		this.input.style.minWidth = minWidth;

		this.setEventListeners();

		//hold the instance on the dom element in order to make it always accessible
		if (!this.tagsInput.stork) {
			this.tagsInput.stork = {};
		}
		this.tagsInput.stork.tags = this;
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
		if (currEL) { // if this event wasn't removed before
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

		for (var i = 0; i < this.eventListeners.length; i++) {
			currEL = this.eventListeners[i];

			if (currEL) {
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

		for (var i = 0; i < this.eventListeners.length; i++) {
			if (this.eventListeners[i]
				&& this.eventListeners[i].element === this.tagsInput
				&& this.eventListeners[i].type === type
				&& this.eventListeners[i].listener === listener) {
				this.eventListeners[i] = null;
			}
		}
	};

	StorkTagsInput.prototype.buildDom = function buildDom() {
		this.ul = document.createElement('ul');

		this.inputLi = document.createElement('li');
		this.input = document.createElement('input');

		this.inputLi.classList.add('search-li');
		this.inputLi.storkTagsProps = {state: null};

		this.input.classList.add('search');
		this.input.storkTagsProps = {paddingLeft: 0, paddingRight: 0};
		this.input.setAttribute('placeholder', this.placeholder);
		if (this.maxlength > 0) {
			this.input.setAttribute('maxlength', this.maxlength);
		}

		this.inputLi.appendChild(this.input);
		this.ul.appendChild(this.inputLi);
		this.tagsInput.appendChild(this.ul);

		this.dropdownContainer = document.createElement('div');
		this.dropdownContainer.classList.add('stork-tags-dropdown-container', 'stork-tags-dropdown-container' + this.rnd);
		this.dropdownContainer.setAttribute('tabindex', 0);

		this.dropdownContainer.storkTagsProps = {
			allLIs: this.dropdownContainer.getElementsByTagName('li'), /*now holds a live HTMLCollection*/
			hoveredLIIndex: null
		};

		this.updateSearchState();

		this.positionDropdown();

		document.body.appendChild(this.dropdownContainer);
	};

	StorkTagsInput.prototype.setEventListeners = function setEventListeners() {
		// typing in search input
		this._addEventListener(this.input, 'keyup', this.onChangeSearchInput.bind(this), false);

		// calculating width when typing in search input
		this._addEventListener(this.input, 'keydown', this.onKeydownSearchInput.bind(this), false);

		// focusing on the search input
		this._addEventListener(this.input, 'focus', this.onFocusSearchInput.bind(this), false);

		// choosing from suggestions dropdown list
		this._addEventListener(this.dropdownContainer, 'click', this.onClickSuggestionsDropdown.bind(this), false);

		// focusing on suggestions items
		this._addEventListener(this.dropdownContainer, 'mousemove', this.onMouseMoveSuggestionsDropdown.bind(this), false);

		// handle clicking on tags (for focus or removal)
		this._addEventListener(this.ul, 'click', this.onClickTagsArea.bind(this), false);

		// focus and blur of tagsInput
		this._addEventListener(document, 'click', this.onClickCheckFocus.bind(this), true);
		this._addEventListener(document, 'keyup', this.onKeyCheckFocus.bind(this), true);

		// suggestions up and down keyboard navigation
		this._addEventListener(this.tagsInput, 'keydown', this.onSuggestionsKeyboardNavigate.bind(this), false);
		this._addEventListener(this.dropdownContainer, 'keydown', this.onSuggestionsKeyboardNavigate.bind(this), false);

		// when focusing via keyboard
		this._addEventListener(this.tagsInput, 'keyup', this.onKeyboardFocus.bind(this), false);

		// navigating the tags
		this._addEventListener(this.tagsInput, 'keydown', this.onTagsKeyboardNavigate.bind(this), false);

		// close the suggestions list on ESC
		this._addEventListener(this.tagsInput, 'keydown', this.onTagsESC.bind(this), false);
	};

	/**
	 * set the position of the dropdown to be just under the tags input.
	 * use this in case the window was resized or when tags-input changed its position
	 * @param {number} [width]
	 */
	StorkTagsInput.prototype.positionDropdown = function positionDropdown(width) {
		if (!width) {
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
		while (this.dropdownContainer.firstChild) {
			this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
		}

		if (suggestionsArr.length === 0) {
			this.dropdownContainer.classList.remove('has-results');
			return;
		}

		// build new suggestions dom
		var i, j, groupDiv, groupHeader, itemsList, item, miscElm;

		for (i = 0; i < suggestionsArr.length; i++) {
			groupDiv = document.createElement('div');
			groupHeader = document.createElement('div');
			miscElm = document.createElement('span');
			itemsList = document.createElement('ul');

			if (suggestionsArr[i].label !== '') {
				miscElm.appendChild(document.createTextNode(suggestionsArr[i].label));
				groupHeader.appendChild(miscElm);
			}

			for (j = 0; j < suggestionsArr[i].items.length; j++) {
				item = document.createElement('li');
				item.storkTagsProps = {
					values: [suggestionsArr[i].items[j].value],
					labels: [suggestionsArr[i].items[j].label],
					groupField: suggestionsArr[i].field,
					groupLabel: suggestionsArr[i].label
				};
				miscElm = document.createElement('a');
				miscElm.appendChild(document.createTextNode(suggestionsArr[i].items[j].label));
				item.appendChild(miscElm);
				itemsList.appendChild(item);
			}

			if (this.showGroups) {
				groupDiv.appendChild(groupHeader);
			}
			groupDiv.appendChild(itemsList);
			this.dropdownContainer.appendChild(groupDiv);
		}

		this.dropdownContainer.storkTagsProps.hoveredLIIndex = null; // allLIs was just re-built so let's forget the previously hovered item (and re-select on the next line)
		this.onMouseMoveSuggestionsDropdown({target: this.dropdownContainer.storkTagsProps.allLIs[0]}); // choose the first items

		this.positionDropdown();
		this.dropdownContainer.classList.add('has-results'); // open the dropdown
	};

	StorkTagsInput.prototype.onClickSuggestionsDropdown = function onClickSuggestionsDropdown(e) {
		var LI = e.target,
			i = 0;

		while (!(LI instanceof HTMLDocument) && LI.tagName.toUpperCase() !== 'LI') {
			if (i++ >= 2) {
				return; // user clicked on something that is too far from our A tag
			}
			LI = LI.parentNode;
		}

		this.addTag(LI.storkTagsProps);
		this.unfocusSuggestions();
		this.input.value = '';

		if (this.persistentSuggestions !== true && this.chosenTags.length >= 1) {
			this.suggestionsCallback([]); //clear suggestions dropdown. this is for when default suggestion (of an empty search string) were chosen
			this.lastSearchString = '';
		}

		this.input.focus();
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

		if (yPos < this.dropdownContainer.scrollTop) {
			this.dropdownContainer.scrollTop = yPos;
		}
		else {
			yPos_bottomPart = yPos + LI.clientHeight;
			if (this.dropdownContainer.scrollTop + this.dropdownContainer.clientHeight < yPos_bottomPart) {
				this.dropdownContainer.scrollTop = yPos_bottomPart - this.dropdownContainer.clientHeight;
			}
		}
	};

	StorkTagsInput.prototype.onMouseMoveSuggestionsDropdown = function onMouseMoveSuggestionsDropdown(e) {
		var LI = e.target,
			i = 0,
			self = this;

		if (!LI || !LI.tagName) {
			console.error('event\'s target is not an HTMLElement');
			return;
		}

		while (!(LI instanceof HTMLDocument) && LI.tagName.toUpperCase() !== 'LI') {
			if (i++ >= 2) {
				return; // user clicked on something that is too far from our A tag
			}
			LI = LI.parentNode;
		}

		var index = this.dropdownContainer.storkTagsProps.hoveredLIIndex;

		if (Number.isInteger(index)) {
			var prevHoveredLI = this.dropdownContainer.storkTagsProps.allLIs[index];
			if (prevHoveredLI === LI) { // haven't moved the mouse from one LI to another
				return;
			}

			prevHoveredLI.classList.remove('focused');
		}

		for (i = 0; i < this.dropdownContainer.storkTagsProps.allLIs.length; i++) {
			if (LI === this.dropdownContainer.storkTagsProps.allLIs[i]) {
				LI.classList.add('focused');
				this.dropdownContainer.storkTagsProps.hoveredLIIndex = i;

				//correct scroll position of suggestions-dropdown if needed.
				//run on next frame so the elements will render
				window.requestAnimationFrame(function () {
					self._scrollSuggestionsDropdownByItem(LI);
				});

				break;
			}
		}
	};

	/**
	 * adds a tag to the chosen tags list and also creates the appropriate LI for it
	 * @param {object} tagObj
	 * 		@param {string} tagObj.groupField
	 * 		@param {string} tagObj.groupLabel
	 * 		@param {array} tagObj.values
	 * 		@param {array} [tagObj.labels]
	 * @returns {boolean}
	 */
	StorkTagsInput.prototype.addTag = function addTag(tagObj) {
		if (this.maxTags > 0 && this.chosenTags.length >= this.maxTags) {
			console.info('Maximum tags in tags input reached (stork-tags' + this.rnd + ')');
			return false;
		}

		var i, k, li, xA, groupSpan, valueSpan, tagIndex, allValuesSpans = [];

		if (typeof tagObj.groupLabel === 'undefined' || tagObj.groupLabel === null) {
			tagObj.groupLabel = capitalizeWords(tagObj.groupField);
		}

		for (i = 0; i < tagObj.values.length; i++) {
			if (!tagObj.labels[i]) {
				tagObj.labels[i] = capitalizeWords(tagObj.values[i]);
			}
		}

		//check if tag already exists
		var groupTagExists = false;
		for (i = 0; i < this.chosenTags.length; i++) {
			if (tagObj.groupField === this.chosenTags[i].data.groupField) {
				for (k = 0; k < this.chosenTags[i].data.values.length; k++) {
					if (tagObj.values.indexOf(this.chosenTags[i].data.values[k]) >= 0) {
						if (this.rechooseRemove) {
							try {
								this.removeTag(i, k);
							}
							catch (e) {
								console.error(e);
								return false;
							}

							return true;
						}

						return false; // fail to add tag since tag already exists
					}
				}

				groupTagExists = true;
				tagIndex = i;
				break;
			}
		}

		if (groupTagExists && this.multiValues) { //append to existing tag
			for (i = 0; i < tagObj.values.length; i++) {
				valueSpan = document.createElement('span');
				valueSpan.classList.add('value');
				valueSpan.appendChild(document.createTextNode(tagObj.labels[i]));

				this.chosenTags[tagIndex].data.values.push(tagObj.values[i]);
				this.chosenTags[tagIndex].data.labels.push(tagObj.labels[i]);
				this.chosenTags[tagIndex].elements.values.push(valueSpan);
				this.chosenTags[tagIndex].elements.tag.appendChild(valueSpan);
				allValuesSpans.push(valueSpan);
			}

		} else { //create new tag
			xA = document.createElement('a');
			xA.classList.add('remove');
			xA.appendChild(document.createTextNode('×'));

			groupSpan = document.createElement('span');
			groupSpan.classList.add('group');
			groupSpan.appendChild(document.createTextNode(tagObj.groupLabel));

			li = document.createElement('li');
			li.classList.add('tag');
			li.appendChild(xA);
			if (this.showGroups && tagObj.groupLabel !== '') {
				li.appendChild(groupSpan);
			}
			this.ul.insertBefore(li, this.inputLi);

			for (i = 0; i < tagObj.values.length; i++) {
				valueSpan = document.createElement('span');
				valueSpan.classList.add('value');
				valueSpan.appendChild(document.createTextNode(tagObj.labels[i]));
				li.appendChild(valueSpan);
				allValuesSpans.push(valueSpan);
			}

			tagIndex = li.index; //the index where the element was inserted

			this.chosenTags.splice(tagIndex, 0, {
				data: {
					values: tagObj.values,
					labels: tagObj.labels,
					groupField: tagObj.groupField,
					groupLabel: tagObj.groupLabel
				},
				elements: {
					tag: li,
					values: allValuesSpans
				}
			});
		}

		this.updateSearchState(); //update the state after the chosenTags has been updated

		//if chosen a new tag view keyboard then trigger focus on input again so the UL will scroll if needed (if there are overflowing tags)
		if (document.activeElement === this.input) {
			this.input.blur();
			this.input.focus();
		}

		var evnt = new CustomEvent('tag-added', {
			bubbles: true,
			cancelable: true,
			detail: {
				tag: this.chosenTags[tagIndex].data,
				elements: this.chosenTags[tagIndex].elements,
				value: tagObj.values,
				index: tagIndex
			}
		});
		this.tagsInput.dispatchEvent(evnt);
	};

	/**
	 * removes a specific tag, from the chosen tags list, in the given index
	 * @param {number} index
	 * @param {number} [valueIndex]
	 * @returns {boolean}
	 */
	StorkTagsInput.prototype.removeTag = function removeTag(index, valueIndex) {
		if (this.chosenTags[index]) {
			this.unfocusTags(); // unselect a focused tag

			var removed;

			// remove tag from tags list
			if (typeof valueIndex === 'number') {
				var removedValue = this.chosenTags[index].data.values[valueIndex];
				this.chosenTags[index].data.values.splice(valueIndex, 1);
				this.chosenTags[index].data.labels.splice(valueIndex, 1);

				var span = this.chosenTags[index].elements.values[valueIndex];
				if (span) {
					this.chosenTags[index].elements.tag.removeChild(span);
					this.chosenTags[index].elements.values.splice(valueIndex, 1);
				} else {
					console.warn('tag\'s value at index ' + valueIndex + ' doesn\'nt have a DOM elements');
				}

				if (this.chosenTags[index].data.values.length > 0) { //there are still values for this group
					var evnt = new CustomEvent('tag-removed', {
						bubbles: true,
						cancelable: true,
						detail: {
							tag: this.chosenTags[index].data,
							elements: this.chosenTags[index].elements,
							value: removedValue,
							index: index
						}
					});
					this.tagsInput.dispatchEvent(evnt);

					return true;
				}
			}

			if (!this.chosenTags[index]) {
				console.info('Tag at index ' + index + ' does not exist');
				return false;
			}

			this.ul.removeChild(this.chosenTags[index].elements.tag);
			removed = this.chosenTags.splice(index, 1);

			if (this.chosenTags.length === 0) {
				this.updateSearchState();
				this.lastSearchString = null; //when tags is empty always allow triggering of default suggestions
			}

			var evnt = new CustomEvent('tag-removed', {
				bubbles: true,
				cancelable: true,
				detail: {
					tag: removed[0].data,
					elements: removed[0].elements,
					index: index
				}
			});
			this.tagsInput.dispatchEvent(evnt);

			this.input.focus();
			return true;
		}
		else {
			throw new Error('index (' + index + ') does not exist in chosenTags array');
		}
	};

	/**
	 * completely clears the chosen tags list
	 * @returns {boolean}
	 */
	StorkTagsInput.prototype.removeAllTags = function removeAllTags() {
		this.unfocusTags(); // unselect a focused tag

		// remove all LIs from tags list
		while (this.ul.firstChild) {
			this.ul.removeChild(this.ul.firstChild);
		}
		this.ul.appendChild(this.inputLi); //re-insert the search-input that was also removed along with all the tag elements

		var removed = this.chosenTags.splice(0, this.chosenTags.length);

		if (this.chosenTags.length === 0) {
			this.updateSearchState();
			this.lastSearchString = null; //when tags is empty always allow triggering of default suggestions
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
	 * change the state of the search whether it is alone or with tags
	 */
	StorkTagsInput.prototype.updateSearchState = function updateSearchState() {
		if (this.chosenTags.length > 0) {
			this.inputLi.classList.add('with-tags');
			this.inputLi.classList.remove('no-tags');
			this.inputLi.storkTagsProps.state = 'with-tags';
			if (!this.persistentPlaceholder) {
				this.input.setAttribute('placeholder', ''); //having chosen tags is like having text in the input, so no placeholder should be shown
			}
			this.calculateSearchInputWidth();
		}
		else {
			this.inputLi.classList.add('no-tags');
			this.inputLi.classList.remove('with-tags');
			this.inputLi.storkTagsProps.state = 'no-tags';
			this.input.setAttribute('placeholder', this.placeholder);
			this.input.style.width = '';
		}
	};

	/**
	 * when clicking the tags area (the UL that acts like input).
	 * this will determine whether to remove a tag or focus it or create-and-focus a search input
	 * @param event
	 */
	StorkTagsInput.prototype.onClickTagsArea = function onClickTagsArea(event) {
		var elm = event.target,
			i = 0;
		do {
			if (this.input.value === '') { //when re-clicking with the mouse on the UL area we will trigger default suggestion
				this.lastSearchString = null;
				this.onChangeSearchInput();
			}

			if (elm.tagName.toUpperCase() === 'A' && elm.classList.contains('remove')) { //handle clicking remove button to remove a tag
				var elmIndex = elm.parentNode.index;
				if (this.inputLi.index < elmIndex) { //if the input-LI is before the tag-LI then the index doesn't correlate with the chosenTags index
					elmIndex--;
				}

				try {
					this.removeTag(elmIndex);
				}
				catch (e) {
					console.warn(e.message);
				}
				finally {
					this.focusSearchInput(0);
				}

				return;
			}
			else if (elm.tagName.toUpperCase() === 'LI') { //handle focusing on tag
				if (elm.classList.contains('tag')) {
					this.onClickFocusTag(elm);
				}
				else if (elm === this.inputLi) {
					this.input.focus();
				}
				return;
			}
			else if (elm.tagName.toUpperCase() === 'UL' && !this.multiline) { //just clicked the UL
				this.redrawSearchInput(event.offsetX);
				return;
			}
			else if (this.multiline) { //clicked outside the line means user wanted to focus the search input and start typing
				this.input.focus();
			}

			elm = elm.parentNode;
			i++;
		} while (i <= 3 && !(elm instanceof HTMLDocument));
	};

	/**
	 * when clicking a tag and focusing it
	 * @param index
	 */
	StorkTagsInput.prototype.onClickFocusTag = function onClickFocusTag(index) {
		if (!Number.isInteger(index)) { // we have got an element object instead of its index
			index = index.index;
			if (this.inputLi.index < index) { //if the input-LI is before the tag-LI then the index doesn't correlate with the chosenTags index
				index--;
			}
		}

		if (Number.isInteger(this.focusedTagIndex)) {
			this.chosenTags[this.focusedTagIndex].elements.tag.classList.remove('focused');
		}

		this.chosenTags[index].elements.tag.classList.add('focused');
		this.focusedTagIndex = index;
		this.tagsInput.focus(); // blurs the search input, but keeps focus on the component

		this.scrollLIIntoView(this.chosenTags[index].elements.tag);
	};

	/**
	 * scroll the selected LI into view if all tags overflow the UL's width
	 * @param li
	 */
	StorkTagsInput.prototype.scrollLIIntoView = function scrollLIIntoView(li) {
		if (!this._tagLIMarginLeft) { //calculate the margin-left of tag-LIs once
			var tagLi = this.ul.querySelector('li.tag'),
				liStyle;

			if (!tagLi) {
				return; //if no tags chosen then no need to scroll into view because only search-input exists so he must be in the view
			}

			liStyle = tagLi.currentStyle || window.getComputedStyle(tagLi);
			this._tagLIMarginLeft = parseInt(liStyle.marginLeft, 10);
		}

		var leftPos = li.offsetLeft;
		var extra = 20; //show extra from the next tag (the one to the left of the current tag)
		this.tagsInput.scrollLeft = leftPos - this._tagLIMarginLeft - extra;
	};

	/**
	 * when clicking the UL for triggering a new search-input in the clicked area
	 * @param {number} x - the position to draw the search-input at
	 * @param {number} [caretPosition] - where to put the caret after focusing the search-input
	 */
	StorkTagsInput.prototype.redrawSearchInput = function redrawSearchInput(x, caretPosition) {
		if (this.chosenTags.length === 0) {
			return; //no need to do anything when there are no tags because the search-input should already fill the whole area
		}

		var idx, closestTagElm;

		// determine the closest tag element to the user's click so we add before it the search input
		for (idx = 0; idx < this.chosenTags.length; idx++) {
			if (!closestTagElm || Math.abs(closestTagElm.offsetLeft - x) > Math.abs(this.chosenTags[idx].elements.tag.offsetLeft - x)) {
				closestTagElm = this.chosenTags[idx].elements.tag;
			}
		}

		var append = this.chosenTags.last.elements.tag === closestTagElm && Math.abs(closestTagElm.offsetLeft - x) > Math.abs(closestTagElm.offsetLeft + closestTagElm.clientWidth - x); //if user clicked closer to the end (after all of the tags)

		if ((append && this.ul.lastChild !== this.inputLi) || (!append && closestTagElm.previousSibling !== this.inputLi)) {
			this.ul.removeChild(this.inputLi);
			this.input.value = '';

			if (append) {
				this.ul.appendChild(this.inputLi);
			} else {
				this.ul.insertBefore(this.inputLi, closestTagElm);
			}
		}

		//when clicking to the right of the input we want to caret to be on the end of the text
		if (typeof caretPosition !== 'number' && this.inputLi.offsetLeft < x) {
			caretPosition = this.input.value.length;
		}

		this.calculateSearchInputWidth();
		this.focusSearchInput(caretPosition);
	};

	StorkTagsInput.prototype.onClickCheckFocus = function onClickCheckFocus(e) {
		var target = e.target,
			evnt;

		while (!(target instanceof HTMLDocument) && target !== this.tagsInput && target !== this.dropdownContainer) {
			target = target.parentNode;

			if (target && target instanceof HTMLDocument) { // our loop reached 'document' element, meaning user clicked outside of the component
				if (this.focused) {
					this.focused = false;
					this.tagsInput.classList.remove('focused');
					this.dropdownContainer.classList.remove('focused');

					if (this.input.value === '') {
						//will trigger a 'default suggestions' (handling suggestion for empty search string) the next time the user focuses the tags-input
						this.lastSearchString = null;
					}

					evnt = new CustomEvent('tags-input-blur', {
						bubbles: true,
						cancelable: true
					});
					this.tagsInput.dispatchEvent(evnt);
				}

				return;
			}
		}

		//user clicked inside the component
		if (!this.focused) {
			this.focused = true;
			this.tagsInput.classList.add('focused');
			this.dropdownContainer.classList.add('focused');

			evnt = new CustomEvent('tags-input-focus', {
				bubbles: true,
				cancelable: true
			});
			this.tagsInput.dispatchEvent(evnt);
		}
	};

	StorkTagsInput.prototype.onKeyCheckFocus = function onKeyCheckFocus(e) {
		this.onClickCheckFocus({target: document.activeElement});
	};

	/**
	 * when the user types in the search-input
	 * @param e
	 */
	StorkTagsInput.prototype.onChangeSearchInput = function onChangeSearchInput(e) {
		if (this.input.value !== this.lastSearchString) {
			if (this.inputLi.storkTagsProps.state === 'with-tags') {
				this.calculateSearchInputWidth();
			}

			if (!this.maxTags || this.chosenTags.length < this.maxTags) {
				this.suggestionsHandler(this.input.value, this.chosenTags, this.suggestionsCallback.bind(this));
			}
		}

		this.lastSearchString = this.input.value;
	};

	StorkTagsInput.prototype.onKeydownSearchInput = function onKeydownSearchInput(event) {
		if (event.key && (event.keyCode >= 48/*0*/ && event.keyCode <= 90/*Z*/) || (event.keyCode >= 186/*;*/ && event.keyCode <= 222/*"*/)) {
			if (this.inputLi.storkTagsProps.state === 'with-tags') {
				this.calculateSearchInputWidth(this.input.value + event.key);
			}
		}
	};

	/**
	 * calculates the text width of the search input and sets the input to that minimal width
	 * @param {string|undefined} [text] - calculate against a specific text
	 */
	StorkTagsInput.prototype.calculateSearchInputWidth = function calculateSearchInputWidth(text) {
		if (!this.textCanvasContext) {
			var textCanvas = document.createElement('canvas');
			var inputStyle = this.input.currentStyle || window.getComputedStyle(this.input);

			this.textCanvasContext = textCanvas.getContext('2d');
			this.textCanvasContext.font = inputStyle.fontStyle + ' ' + inputStyle.fontWeight + ' ' + inputStyle.fontSize + ' ' + inputStyle.fontFamily;
			this.input.storkTagsProps.paddingLeft = parseInt(inputStyle.paddingLeft, 10);
			this.input.storkTagsProps.paddingRight = parseInt(inputStyle.paddingRight, 10);
		}

		var textMetrics = this.textCanvasContext.measureText(text || this.input.value);
		//note - the +1 pixel is for limiting the minimum width to 1px and also prevents weird width jumps while typing
		var finalWidth = Math.ceil(textMetrics.width + this.input.storkTagsProps.paddingLeft + this.input.storkTagsProps.paddingRight + 1) + 'px';

		if (this.inputLi.storkTagsProps.state === 'no-tags') {
			this.input.style.width = ''; //a just-in-case case. this if-block will probably never run
		} else {
			this.input.style.width = finalWidth;
		}

		return finalWidth;
	};

	/**
	 * when focusing on the search-input
	 * @param e
	 */
	StorkTagsInput.prototype.onFocusSearchInput = function onFocusSearchInput(e) {
		this.unfocusTags();
		this.scrollLIIntoView(this.inputLi); //input-LI's index is actually the next tag's index in 'chosenTags' (if there is any)
		this.onChangeSearchInput();
	};

	StorkTagsInput.prototype.onSuggestionsKeyboardNavigate = function onSuggestionsKeyboardNavigate(e) {
		var key = keyboardMap[e.keyCode];
		var hoveredIndex;
		var allLIs;

		if (this.dropdownContainer.storkTagsProps.allLIs.length === 0 || !this.dropdownContainer.classList.contains('focused')) {
			return;
		}

		if (key === 'DOWN' || key === 'UP' || key === 'ENTER') {
			e.preventDefault(); // stops document scrolling

			hoveredIndex = this.dropdownContainer.storkTagsProps.hoveredLIIndex;
			allLIs = this.dropdownContainer.storkTagsProps.allLIs;

			if (key === 'DOWN') {
				// first time selection on this list or trying to select over the end of the list
				if (!Number.isInteger(hoveredIndex) || hoveredIndex === allLIs.length - 1) {
					this.onMouseMoveSuggestionsDropdown({target: allLIs[0]});
				}
				else {
					this.onMouseMoveSuggestionsDropdown({target: allLIs[hoveredIndex + 1]});
				}
			}
			else if (key === 'UP') {
				// first time selection on this list or trying to select over the beginning of the list
				if (!Number.isInteger(hoveredIndex) || hoveredIndex === 0) {
					this.onMouseMoveSuggestionsDropdown({target: allLIs[allLIs.length - 1]});
				}
				else {
					this.onMouseMoveSuggestionsDropdown({target: allLIs[hoveredIndex - 1]});
				}
			}
			else if (key === 'ENTER') {
				if (Number.isInteger(hoveredIndex)) {
					this.onClickSuggestionsDropdown({target: allLIs[hoveredIndex]});
				}
				else { // as a precaution, an enter when no item is selected first selects the first item
					this.onMouseMoveSuggestionsDropdown({target: allLIs[0]});
				}
			}
		}
	};

	StorkTagsInput.prototype.onTagsKeyboardNavigate = function onTagsKeyboardNavigate(e) {
		var key = keyboardMap[e.keyCode];
		// TODO multiliner support
		if (key === 'LEFT') {
			if (this.input === document.activeElement && this.inputLi.previousSibling && !Number.isInteger(this.focusedTagIndex) && this.input.selectionStart === 0) {
				this.onClickFocusTag(this.inputLi.previousSibling.index);
			}
			else if (Number.isInteger(this.focusedTagIndex) && !this.multiline) {
				this.redrawSearchInput(this.chosenTags[this.focusedTagIndex].elements.tag.offsetLeft - 1, this.input.value.length);
				e.preventDefault(); //focusing on the input will cause the LEFT press to move the caret so we will prevent this
			}
			else if (Number.isInteger(this.focusedTagIndex) && this.multiline) {
				if (this.focusedTagIndex - 1 >= 0) {
					this.onClickFocusTag(this.focusedTagIndex - 1);
				}
				e.preventDefault(); //focusing on the input will cause the LEFT press to move the caret so we will prevent this
			}
		}
		else if (key === 'RIGHT') {
			if (this.input === document.activeElement && this.inputLi.nextSibling && !Number.isInteger(this.focusedTagIndex) && this.input.selectionStart >= this.input.value.length) {
				this.onClickFocusTag(this.inputLi.nextSibling.index - 1);
			}
			else if (Number.isInteger(this.focusedTagIndex) && !this.multiline) {
				this.redrawSearchInput(this.chosenTags[this.focusedTagIndex].elements.tag.offsetLeft + this.chosenTags[this.focusedTagIndex].elements.tag.clientWidth + 1, 0);
				e.preventDefault(); //focusing on the input will cause the RIGHT press to move the caret so we will prevent this
			}
			else if (Number.isInteger(this.focusedTagIndex) && this.multiline) {
				if (this.chosenTags.length - 1 > this.focusedTagIndex) {
					this.onClickFocusTag(this.focusedTagIndex + 1);
				}
				else {
					this.focusSearchInput(this.input.value.length);
					e.preventDefault();//focusing on the input will cause the RIGHT press to move the caret so we will prevent this
				}

			}
		}
		else if (key === 'BACKSPACE' || key === 'DELETE') {
			if (this.input === document.activeElement) {
				if (this.tagDeleteThrottle.allowed && this.input.value === '') { //trying to delete "beyond" the input
					try {
						if (key === 'BACKSPACE' && this.inputLi.previousSibling) {
							this.removeTag(this.inputLi.previousSibling.index);
						}
						else if (key === 'DELETE' && this.inputLi.nextSibling) {
							this.removeTag(this.inputLi.index); //the input-LI is before the tag-LI so the tag's-elm index is greater by 1 from its tag's index in chosenTags
						}
						this.positionDropdown();
					}
					catch (e) {
						console.warn(e.message);
					}
				}

				// for any delete we will throttle the option to delete a tag so user won't accidentally delete all tags when holding down DELETE key.
				// if user quickly taps the DELETE key then don't always reset the timeout when input is empty.
				if (this.input.value !== '' || this.tagDeleteThrottle.allowed) {
					this.tagDeleteThrottle.allowed = false; // disallow keyboard deleting
					clearTimeout(this.tagDeleteThrottle.TO);
					this.tagDeleteThrottle.TO = setTimeout((function () {
						this.tagDeleteThrottle.allowed = true;
					}).bind(this), 400);
				}
			}
			else if (Number.isInteger(this.focusedTagIndex)) {
				var tmpFocusedTagIndex = this.focusedTagIndex; //save this index number because redrawing the search-input will focus it and trigger 'unfocusTags()'
				if (!this.multiline) {
					this.redrawSearchInput(this.chosenTags[this.focusedTagIndex].elements.tag.offsetLeft - 1);
				}
				try {
					this.removeTag(tmpFocusedTagIndex);
				}
				catch (e) {
					console.warn(e.message);
				}
				finally {
					this.positionDropdown();
					this.focusSearchInput(0);
				}

				e.preventDefault(); // stops document scrolling
			}
		}
	};

	/**
	 * when focused on the tags area, clicking ESC key will hide the suggestions list
	 * @param e
	 */
	StorkTagsInput.prototype.onTagsESC = function onTagsESC(e) {
		var key = keyboardMap[e.keyCode];

		if (key === 'ESCAPE') {
			if (this.dropdownContainer.classList.contains('has-results')) {
				this.dropdownContainer.classList.remove('has-results');
			} else {
				this.input.value = '';
				this.onChangeSearchInput();
			}
		}
	};

	/**
	 * prevent user from focusing on the component itself, because it is useless. instead we focus him onto the search input
	 * @param e
	 */
	StorkTagsInput.prototype.onKeyboardFocus = function onKeyboardFocus(e) {
		var key = keyboardMap[e.keyCode];

		if (key === 'TAB' && !e.shiftKey) {
			if (document.activeElement === this.tagsInput) {
				this.input.focus();
			}
		}
	};

	StorkTagsInput.prototype.unfocusSuggestions = function unfocusSuggestions() {
		if (Number.isInteger(this.dropdownContainer.storkTagsProps.hoveredLIIndex)) {
			//if user types too fast the list might be closed and DOM elements get removed and then this code runs
			//and throws an error because 'allLIs[hoveredLIIndex]' might not exist
			if (this.dropdownContainer.storkTagsProps.allLIs[this.dropdownContainer.storkTagsProps.hoveredLIIndex]) {
				this.dropdownContainer.storkTagsProps.allLIs[this.dropdownContainer.storkTagsProps.hoveredLIIndex].classList.remove('focused');
			}
		}
		else { // brute force
			for (var i = 0; i < this.dropdownContainer.storkTagsProps.allLIs.length; i++) {
				if (this.dropdownContainer.storkTagsProps.allLIs[i].classList.contains('focused')) {
					this.dropdownContainer.storkTagsProps.allLIs[i].classList.remove('focused');
				}
			}
		}

		this.dropdownContainer.storkTagsProps.hoveredLIIndex = null;
	};

	StorkTagsInput.prototype.unfocusTags = function unfocusTags() {
		if (Number.isInteger(this.focusedTagIndex)) {
			this.chosenTags[this.focusedTagIndex].elements.tag.classList.remove('focused');
		}
		else { // brute force
			for (var i = 0; i < this.chosenTags.length; i++) {
				if (this.chosenTags[i].elements.tag.classList.contains('focused')) {
					this.chosenTags[i].elements.tag.classList.remove('focused');
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
		setTimeout(function () { // fixes a bug where inputs caret doesn't move and/or text doesn't really get selected
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
		while (this.tagsInput.firstChild) {
			this.tagsInput.removeChild(this.tagsInput.firstChild);
		}
		while (this.dropdownContainer.firstChild) {
			this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
		}
		this.dropdownContainer.parentNode.removeChild(this.dropdownContainer);

		// remove properties
		this.tagsInput.classList.remove('stork-tags', 'stork-tags' + this.rnd);
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
})(window); // main scope we are running at (if 'this' is passed then we will be compatible with node 'module.reports' style)