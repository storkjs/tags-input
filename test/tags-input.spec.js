'use strict';

describe('Tags Input', function () {
	it('construct a tagsInput instance', function () {
		console.log();
		var tags = new storkTagsInput({
			element: document.createElement('div'),
			suggestionsType: 'ajax',
			suggestionsHandler: function(cb){},
			rechooseRemove: true,
			inputMinWidth: 70
		});
		assert(typeof tags === 'object');
		assert(tags instanceof storkTagsInput);
	});
});
