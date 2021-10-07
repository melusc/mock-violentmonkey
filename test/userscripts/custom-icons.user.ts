// Taken and adapted from https://github.com/melusc/moodle_userscripts/blob/705d87f64fff2b3218b01b3febd5bacaa0367d88/src/Custom%20Icons/shared.ts#L211-L223

const updateDeprecatedSplitDataURI = (uuid: string): string => {
	const values = GM_getValue<
		Record<string, {mediaType: string; rawByteString: string}> | undefined
	>('values');
	const object = values?.[uuid];

	if (!object) {
		throw new Error(`${uuid} was not found.`);
	}

	const {mediaType, rawByteString} = object;

	const dataURI = `data:${mediaType};base64,${rawByteString}`;
	GM_setValue('values', {
		...values,
		[uuid]: {
			dataURI,
		},
	});

	return dataURI;
};

export {updateDeprecatedSplitDataURI};
