'use strict';

describe('Tags Input', function () {
	it('construct a tagsInput instance', function () {
		var tags = new storkTagsInput({
			element: document.createElement('div'),
			suggestionsHandler: function(cb){},
			rechooseRemove: true,
			inputMinWidth: 70
		});
		assert(typeof tags === 'object');
		assert(tags instanceof storkTagsInput);
	});
});
