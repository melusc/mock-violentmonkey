import type {ExecutionContext, Macro} from 'ava';
import {violentMonkeyContext} from './violentmonkey-context.js';

type MacroCb<Context = unknown> = (
	t: ExecutionContext<Context>,
) => Promise<void> | void;

/* It has to be curried because that way
	you can do violentMonkeyContextMacro<{foo: 'bar'}>()
	or let typescript autofill that like in violentmonkey-context-macro.test.ts

	If you have a better solution to this I'm open to ideas
 */

export const violentMonkeyContextMacro = <Context = unknown>(): Macro<
	[MacroCb<Context>],
	Context
> => ({
	exec: (t, run) => violentMonkeyContext(run)(t),
});
