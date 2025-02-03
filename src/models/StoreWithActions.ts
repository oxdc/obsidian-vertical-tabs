import {
	createStore,
	Mutate,
	StateCreator,
	StoreApi,
	StoreMutatorIdentifier,
} from "zustand";

type Write<T extends object, U extends object> = Omit<T, keyof U> & U;
type Cast<T, U> = T extends U ? T : U;

type ExtractActions<T> = T extends { actions: infer A } ? A : never;
type StoreWithActions<T> = T & { actions: ExtractActions<T> };

type WithActions = <
	T,
	Mps extends [StoreMutatorIdentifier, unknown][] = [],
	Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
	f: StateCreator<T, [...Mps, ["withActions", ExtractActions<T>]], Mcs>
) => StateCreator<T, Mps, [["withActions", ExtractActions<T>], ...Mcs]>;

declare module "zustand" {
	interface StoreMutators<S, A> {
		withActions: Write<Cast<S, object>, { getActions: () => A }>;
	}
}

type Api<T> = StoreApi<StoreWithActions<T>>;
type SetState<T> = StoreApi<StoreWithActions<T>>["setState"];
type GetState<T> = StoreApi<StoreWithActions<T>>["getState"];

const actionsImpl =
	<T>(f: StateCreator<StoreWithActions<T>, [], []>) =>
	(set: SetState<T>, get: GetState<T>, _store: Api<T>) => {
		const store = _store as Mutate<
			StoreApi<StoreWithActions<T>>,
			[["withActions", ExtractActions<T>]]
		>;

		store.getActions = () => _store.getState().actions;
		return f(set, get, _store);
	};

export const actions = actionsImpl as unknown as WithActions;

export const createStoreWithActions = <T>(f: StateCreator<T, [], []>) =>
	createStore<T>()(actions(f));
