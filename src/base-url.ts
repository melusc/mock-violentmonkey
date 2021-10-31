import {VMStorage} from './vm-storage';

const baseUrls = new VMStorage<URL>(() => new URL('http://localhost:5000/'));

/** @internal */
export const getBaseUrl = () => baseUrls.get(true);

export const setBaseUrl = (baseUrl: string | URL) => {
	baseUrls.set(new URL(baseUrl));
};
