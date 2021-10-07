import {AsyncLocalStorage} from 'node:async_hooks';

const tabIds = new AsyncLocalStorage<number>();

/**
 * @internal
 */
const getTabId = () => tabIds.getStore() ?? 0;

// 0 is for no tab
let idSeq = 1;
/**
 * Create a new tab instance
 *
 * @returns Returns what the callback returns
 */
const tabContext = <ReturnV>(cb: () => ReturnV) => tabIds.run(++idSeq, cb);

export {getTabId, tabContext};
