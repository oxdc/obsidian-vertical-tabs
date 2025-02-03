import {
	Mutate,
	StateCreator,
	StoreApi,
	StoreMutatorIdentifier,
} from "zustand";

type Write<T extends object, U extends object> = Omit<T, keyof U> & U;
type Cast<T, U> = T extends U ? T : U;

type Actions = Record<string, CallableFunction>;

type StoreWithActions<T> = T extends { actions: Actions }
	? T
	: T & { actions: Actions };

type WithActions = <
	T,
	A,
	Mps extends [StoreMutatorIdentifier, unknown][] = [],
	Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
	f: StateCreator<T, [...Mps, ["withActions", A]], Mcs>
) => StateCreator<T, Mps, [["withActions", A], ...Mcs]>;

declare module "zustand" {
	interface StoreMutators<S, A> {
		withActions: Write<Cast<S, object>, { getActions: A }>;
	}
}

type ActionsImpl = <T, S extends StoreWithActions<T>>(
	f: StateCreator<S, [], []>
) => StateCreator<S, [], []>;

const actionsImpl: ActionsImpl = (f) => (set, get, _store) => {
	type T = ReturnType<typeof f>;
	type A = () => T["actions"];
	const store = _store as Mutate<
		StoreApi<StoreWithActions<T>>,
		[["withActions", A]]
	>;
	store.getActions = () => _store.getState().actions;
	return f(set, get, _store);
};

export const actions = actionsImpl as unknown as WithActions;
