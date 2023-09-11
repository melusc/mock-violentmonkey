import test from 'ava';

import {
	GM_getValue,
	GM_setValue,
	violentMonkeyContext,
} from '../../src/index.js';

import {updateDeprecatedSplitDataURI} from './custom-icons.user.js';

test(
	'updateDeprecatedSplitDataURI should return correct dataURIs',
	violentMonkeyContext(t => {
		GM_setValue('values', {
			AZRQv: {
				rawByteString: 'SGVsbG8gdGhlcmU=',
				mediaType: 'image/png',
			},
			'7320f': {
				rawByteString: 'NzMyMGY=',
				mediaType: 'image/jpeg',
			},
		});

		const result = updateDeprecatedSplitDataURI('AZRQv');

		t.is(result, 'data:image/png;base64,SGVsbG8gdGhlcmU=');

		t.deepEqual(GM_getValue('values'), {
			AZRQv: {
				dataURI: 'data:image/png;base64,SGVsbG8gdGhlcmU=',
			},
			'7320f': {
				rawByteString: 'NzMyMGY=',
				mediaType: 'image/jpeg',
			},
		});
	}),
);
