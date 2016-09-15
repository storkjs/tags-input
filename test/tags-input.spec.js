'use strict';

describe('Tags Input', function () {
	var tags, tagsDiv;
	tagsDiv = document.createElement('div');
	document.body.appendChild(tagsDiv);
	tagsDiv.style.width = '600px';
	tagsDiv.style.height = '24px';

	it('Construct a tagsInput instance', function () {
		tags = new StorkTagsInput({
			element: tagsDiv,
			suggestionsHandler: function(cb){},
			rechooseRemove: true,
			inputMinWidth: 70
		});
		assert(typeof tags === 'object', 'Tags is a JS object');
		assert(tags instanceof StorkTagsInput, 'Tags instacne is instanceof StorkTagsInput');
	});

	it('Check initial DOM', function () {
		assert(tags.ul instanceof HTMLElement, 'a UL DOM element is created');
		assert(tags.ul.childNodes.length === 1, 'the UL has only one child');
		assert(tags.ul.firstChild.tagName.toUpperCase() === 'LI', 'UL\'s child is LI');
		assert(tags.ul.firstChild.classList.contains('search-li'), 'the LI has search class');
		assert(tags.ul.firstChild.firstChild.tagName.toUpperCase() === 'INPUT', 'LI\'s child is INPUT');
		assert(tags.ul.firstChild.firstChild.classList.contains('search'), 'the INPUT has search class');
	});

	it('Check initial chosenTags', function() {
		assert(Array.isArray(tags.chosenTags), 'chosenTags is an array');
		assert(tags.chosenTags.length === 0, 'chosenTags is empty');
	});

	it('Add tags', function() {
		tags.addTag({ value: 'val1', label: 'label1', groupField: 'groupVal1', groupLabel: 'groupLabel1' });
		tags.addTag({ value: 'val2', label: 'label2', groupField: 'groupVal2', groupLabel: 'groupLabel2' });
		assert(tags.chosenTags.length === 2, 'chosenTags has 1 tag');
		assert(tags.ul.childNodes.length === 3, 'UL has 2 LIs');
	});

	it('Check tags place', function() {
		assert(tags.chosenTags[0].value === 'val1', 'first tag is val1');
		assert(tags.ul.childNodes[0] === tags.chosenTags[0].elm, 'first tag-dom-element is the first tag in chosenTags array');
		assert(tags.chosenTags[1].value === 'val2', 'second tag is val2');
		assert(tags.ul.childNodes[1] === tags.chosenTags[1].elm, 'second tag-dom-element is the second tag in chosenTags array');
	});

	it('Test click on tags-area event listener', function() {
		tags.onClickTagsArea({ target: tags.ul, offsetX: tags.ul.firstChild.nextSibling.getBoundingClientRect().left });
		assert(tags.ul.childNodes[1] === tags.inputLi, 'search input has moved to second place');
	});

	it('Insert new tag in-between existing tags', function() {
		tags.addTag({ value: 'val3', label: 'label3', groupField: 'groupVal3', groupLabel: 'groupLabel3' });
		assert(tags.chosenTags[1].value === 'val3', 'second tag is val3');
		assert(tags.ul.childNodes[1] === tags.chosenTags[1].elm, 'second tag-dom-element is the second tag in chosenTags array which is val3');
		assert(tags.ul.childNodes[2] === tags.inputLi, 'search input has moved to third place');
		assert(tags.ul.childNodes[3] === tags.chosenTags[2].elm && tags.chosenTags[2].value === 'val2', 'fourth LI is the third tag in chosenTags array which is val2');
	});
});
