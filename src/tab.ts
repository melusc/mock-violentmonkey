import {AsyncLocalStorage} from 'node:async_hooks';

const tabIds = new AsyncLocalStorage<number>();

/**
 * @internal
 */
const getTabId = () => tabIds.getStore() ?? 0;

// Pre-increment means 0 will never be a tab-id
// 0 is the tab-id of "no tab"
let idSeq = 0;
/**
 * Create a new tab instance
 *
 * @returns Returns what the callback returns
 */
const tabContext = <ReturnV>(cb: () => ReturnV) => tabIds.run(++idSeq, cb);

export {getTabId, tabContext};
