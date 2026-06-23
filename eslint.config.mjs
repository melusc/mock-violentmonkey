import config from '@lusc/eslint-config';

export default [
	...config,
	{
		rules: {
			'promise/prefer-await-to-callbacks': 'off',
			'n/no-unsupported-features/node-builtins': [
				'error',
				{
					// experimental but supported
					ignores: [
						'URL.createObjectURL',
						'FormData',
						'File',
						'buffer.resolveObjectURL',
					],
				},
			],
			'@typescript-eslint/no-explicit-any': 'off',
			// TODO: This is supported from Node >=v25
			'unicorn/prefer-uint8array-base64': 'off',
			'unicorn/no-top-level-side-effects': 'off',
			'unicorn/comment-content': 'off',
		},
	},
];
