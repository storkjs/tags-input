(function(root) {
	"use strict";

	var keyboardMap = [
		'', /*0*/
		'', /*1*/
		'', /*2*/
		'CANCEL', /*3*/
		'', /*4*/
		'', /*5*/
		'HELP', /*6*/
		'', /*7*/
		'BACKSPACE', /*8*/
		'TAB', /*9*/
		'', /*10*/
		'', /*11*/
		'CLEAR', /*12*/
		'ENTER', /*13*/
		'ENTER_SPECIAL', /*14*/
		'', /*15*/
		'SHIFT', /*16*/
		'CONTROL', /*17*/
		'ALT', /*18*/
		'PAUSE', /*19*/
		'CAPS_LOCK', /*20*/
		'KANA', /*21*/
		'EISU', /*22*/
		'JUNJA', /*23*/
		'FINAL', /*24*/
		'HANJA', /*25*/
		'', /*26*/
		'ESCAPE', /*27*/
		'CONVERT', /*28*/
		'NONCONVERT', /*29*/
		'ACCEPT', /*30*/
		'MODECHANGE', /*31*/
		'SPACE', /*32*/
		'PAGE_UP', /*33*/
		'PAGE_DOWN', /*34*/
		'END', /*35*/
		'HOME', /*36*/
		'LEFT', /*37*/
		'UP', /*38*/
		'RIGHT', /*39*/
		'DOWN', /*40*/
		'SELECT', /*41*/
		'PRINT', /*42*/
		'EXECUTE', /*43*/
		'PRINTSCREEN', /*44*/
		'INSERT', /*45*/
		'DELETE', /*46*/
		'', /*47*/
		'0', /*48*/
		'1', /*49*/
		'2', /*50*/
		'3', /*51*/
		'4', /*52*/
		'5', /*53*/
		'6', /*54*/
		'7', /*55*/
		'8', /*56*/
		'9', /*57*/
		'COLON', /*58*/
		'SEMICOLON', /*59*/
		'LESS_THAN', /*60*/
		'EQUALS', /*61*/
		'GREATER_THAN', /*62*/
		'QUESTION_MARK', /*63*/
		'AT', /*64*/
		'A', /*65*/
		'B', /*66*/
		'C', /*67*/
		'D', /*68*/
		'E', /*69*/
		'F', /*70*/
		'G', /*71*/
		'H', /*72*/
		'I', /*73*/
		'J', /*74*/
		'K', /*75*/
		'L', /*76*/
		'M', /*77*/
		'N', /*78*/
		'O', /*79*/
		'P', /*80*/
		'Q', /*81*/
		'R', /*82*/
		'S', /*83*/
		'T', /*84*/
		'U', /*85*/
		'V', /*86*/
		'W', /*87*/
		'X', /*88*/
		'Y', /*89*/
		'Z', /*90*/
		'OS_KEY', /*91 - Windows Key (Windows) or Command Key (Mac)*/
		'', /*92*/
		'CONTEXT_MENU', /*93*/
		'', /*94*/
		'SLEEP', /*95*/
		'NUMPAD0', /*96*/
		'NUMPAD1', /*97*/
		'NUMPAD2', /*98*/
		'NUMPAD3', /*99*/
		'NUMPAD4', /*100*/
		'NUMPAD5', /*101*/
		'NUMPAD6', /*102*/
		'NUMPAD7', /*103*/
		'NUMPAD8', /*104*/
		'NUMPAD9', /*105*/
		'MULTIPLY', /*106*/
		'ADD', /*107*/
		'SEPARATOR', /*108*/
		'SUBTRACT', /*109*/
		'DECIMAL', /*110*/
		'DIVIDE', /*111*/
		'F1', /*112*/
		'F2', /*113*/
		'F3', /*114*/
		'F4', /*115*/
		'F5', /*116*/
		'F6', /*117*/
		'F7', /*118*/
		'F8', /*119*/
		'F9', /*120*/
		'F10', /*121*/
		'F11', /*122*/
		'F12', /*123*/
		'F13', /*124*/
		'F14', /*125*/
		'F15', /*126*/
		'F16', /*127*/
		'F17', /*128*/
		'F18', /*129*/
		'F19', /*130*/
		'F20', /*131*/
		'F21', /*132*/
		'F22', /*133*/
		'F23', /*134*/
		'F24', /*135*/
		'', /*136*/
		'', /*137*/
		'', /*138*/
		'', /*139*/
		'', /*140*/
		'', /*141*/
		'', /*142*/
		'', /*143*/
		'NUM_LOCK', /*144*/
		'SCROLL_LOCK', /*145*/
		'WIN_OEM_FJ_JISHO', /*146*/
		'WIN_OEM_FJ_MASSHOU', /*147*/
		'WIN_OEM_FJ_TOUROKU', /*148*/
		'WIN_OEM_FJ_LOYA', /*149*/
		'WIN_OEM_FJ_ROYA', /*150*/
		'', /*151*/
		'', /*152*/
		'', /*153*/
		'', /*154*/
		'', /*155*/
		'', /*156*/
		'', /*157*/
		'', /*158*/
		'', /*159*/
		'CIRCUMFLEX', /*160*/
		'EXCLAMATION', /*161*/
		'DOUBLE_QUOTE', /*162*/
		'HASH', /*163*/
		'DOLLAR', /*164*/
		'PERCENT', /*165*/
		'AMPERSAND', /*166*/
		'UNDERSCORE', /*167*/
		'OPEN_PAREN', /*168*/
		'CLOSE_PAREN', /*169*/
		'ASTERISK', /*170*/
		'PLUS', /*171*/
		'PIPE', /*172*/
		'HYPHEN_MINUS', /*173*/
		'OPEN_CURLY_BRACKET', /*174*/
		'CLOSE_CURLY_BRACKET', /*175*/
		'TILDE', /*176*/
		'', /*177*/
		'', /*178*/
		'', /*179*/
		'', /*180*/
		'VOLUME_MUTE', /*181*/
		'VOLUME_DOWN', /*182*/
		'VOLUME_UP', /*183*/
		'', /*184*/
		'', /*185*/
		'SEMICOLON', /*186*/
		'EQUALS', /*187*/
		'COMMA', /*188*/
		'MINUS', /*189*/
		'PERIOD', /*190*/
		'SLASH', /*191*/
		'BACK_QUOTE', /*192*/
		'', /*193*/
		'', /*194*/
		'', /*195*/
		'', /*196*/
		'', /*197*/
		'', /*198*/
		'', /*199*/
		'', /*200*/
		'', /*201*/
		'', /*202*/
		'', /*203*/
		'', /*204*/
		'', /*205*/
		'', /*206*/
		'', /*207*/
		'', /*208*/
		'', /*209*/
		'', /*210*/
		'', /*211*/
		'', /*212*/
		'', /*213*/
		'', /*214*/
		'', /*215*/
		'', /*216*/
		'', /*217*/
		'', /*218*/
		'OPEN_BRACKET', /*219*/
		'BACK_SLASH', /*220*/
		'CLOSE_BRACKET', /*221*/
		'QUOTE', /*222*/
		'', /*223*/
		'META', /*224*/
		'ALTGR', /*225*/
		'', /*226*/
		'WIN_ICO_HELP', /*227*/
		'WIN_ICO_00', /*228*/
		'', /*229*/
		'WIN_ICO_CLEAR', /*230*/
		'', /*231*/
		'', /*232*/
		'WIN_OEM_RESET', /*233*/
		'WIN_OEM_JUMP', /*234*/
		'WIN_OEM_PA1', /*235*/
		'WIN_OEM_PA2', /*236*/
		'WIN_OEM_PA3', /*237*/
		'WIN_OEM_WSCTRL', /*238*/
		'WIN_OEM_CUSEL', /*239*/
		'WIN_OEM_ATTN', /*240*/
		'WIN_OEM_FINISH', /*241*/
		'WIN_OEM_COPY', /*242*/
		'WIN_OEM_AUTO', /*243*/
		'WIN_OEM_ENLW', /*244*/
		'WIN_OEM_BACKTAB', /*245*/
		'ATTN', /*246*/
		'CRSEL', /*247*/
		'EXSEL', /*248*/
		'EREOF', /*249*/
		'PLAY', /*250*/
		'ZOOM', /*251*/
		'', /*252*/
		'PA1', /*253*/
		'WIN_OEM_CLEAR', /*254*/
		'' /*255*/
	];

	var getPosition = function getPosition(elm) {
		var xPos = 0;
		var yPos = 0;

		while (elm) {
			xPos += (elm.offsetLeft);
			yPos += (elm.offsetTop);

			elm = elm.offsetParent;
		}
		return {
			x: xPos,
			y: yPos
		};
	};

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
		this.rechooseRemove = options.rechooseRemove || false;
		this.chosenTags = [];

		this.tagsInput.classList.add('stork-tags', 'stork-tags'+this.rnd);

		this.buildDom();

		this.setEventListeners();

		this.updateWidths();
	};

	storkTagsInput.prototype.buildDom = function buildDom() {
		var ul = document.createElement('ul');
		var li = document.createElement('li');
		var input = document.createElement('input');

		li.classList.add('search');

		li.appendChild(input);
		ul.appendChild(li);
		this.tagsInput.appendChild(ul);

		var dropdownContainer = document.createElement('div');
		dropdownContainer.classList.add('stork-tags-dropdown-container', 'stork-tags-dropdown-container'+this.rnd);
		dropdownContainer.style.display = 'none';
		dropdownContainer.style.width = this.tagsInput.offsetWidth + 'px';

		var xy = getPosition(this.tagsInput);
		dropdownContainer.style.left = xy.x + 'px';
		dropdownContainer.style.top = (xy.y + this.tagsInput.offsetHeight + 1) + 'px';

		this.ul = ul;
		this.input = input;
		this.dropdownContainer = dropdownContainer;

		document.body.appendChild(dropdownContainer);
	};

	storkTagsInput.prototype.setEventListeners = function setEventListeners() {
		var self = this;

		// typing in search input
		this.input.addEventListener('keyup', function(e) {
			if(this.value.length) {
				self.suggestionsHandler(this.value, self.suggestionsCallback.bind(self));
			}
		}, false);

		// choosing from suggestions dropdown list
		this.dropdownContainer.addEventListener('click', this.onClickSuggestionsDropdown.bind(this), false);
	};

	storkTagsInput.prototype.updateWidths = function updateWidths() {
		if(!this.maxWidth) {
			this.maxWidth = this.tagsInput.clientWidth;
		}

		this.input.parentNode.style.width = this.maxWidth + 'px';
	};

	storkTagsInput.prototype.suggestionsCallback = function suggestionsCallback(suggestionsObj) {
		if(suggestionsObj.length === 0) {
			this.dropdownContainer.style.display = 'none';
			return;
		}

		this.dropdownContainer.style.display = 'block';

		// empty the dropdown's previous content
		while(this.dropdownContainer.firstChild) {
			this.dropdownContainer.removeChild(this.dropdownContainer.firstChild);
		}

		var i, j, groupDiv, groupHeader, itemsList, item, miscElm;

		for(i=0; i < suggestionsObj.length; i++) {
			groupDiv = document.createElement('div');
			groupHeader = document.createElement('div');
			miscElm = document.createElement('span');
			itemsList = document.createElement('ul');

			miscElm.appendChild(document.createTextNode(suggestionsObj[i].displayName));
			groupHeader.appendChild(miscElm);

			for(j=0; j < suggestionsObj[i].items.length; j++) {
				item = document.createElement('li');
				miscElm = document.createElement('a');
				miscElm.storkTagsProps = {
					value: suggestionsObj[i].items[j].value,
					displayName: suggestionsObj[i].items[j].displayName,
					groupId: suggestionsObj[i].id,
					groupDisplayName: suggestionsObj[i].displayName
				};
				miscElm.appendChild(document.createTextNode(suggestionsObj[i].items[j].displayName));
				item.appendChild(miscElm);
				itemsList.appendChild(item);
			}

			groupDiv.appendChild(groupHeader);
			groupDiv.appendChild(itemsList);
			this.dropdownContainer.appendChild(groupDiv);
		}
	};

	storkTagsInput.prototype.onClickSuggestionsDropdown = function onClickSuggestionsDropdown(e) {
		var A = e.target,
			i = 0;

		while(A.tagName.toUpperCase() !== 'A') {
			if(i++ >= 2) {
				return; // user clicked on something that is too far from our A tag
			}
			A = A.parentNode;
		}

		this.addTag(A.storkTagsProps);
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
		var textSpan = document.createElement('span');

		xA.appendChild(document.createTextNode('×'));
		textSpan.appendChild(document.createTextNode(tagObj.groupDisplayName + ' : ' + tagObj.displayName));

		li.classList.add('tag');
		xA.classList.add('remove');

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
		if(this.chosenTags[index]) {
			this.chosenTags[index].elm.parentNode.removeChild(this.chosenTags[index].elm);
			this.chosenTags.splice(index, 1);
			return true; // success
		}

		return false; // fail
	};

	root.storkTagsInput = storkTagsInput;
})(this); // main scope we run at (should be 'window')