import {
	db,
	TabMetadata,
	GroupMetadata,
	Metadata,
	PartialMetadata,
	TabUpdates,
	GroupUpdates,
	TabMetadataMap,
	GroupMetadataMap,
	TabResult,
	GroupResult,
} from "./TabMetadataDB";
import { Table } from "dexie";
import { Identifier } from "src/models/VTWorkspace";

const LRU_CACHE_SIZE = 100;

class MetadataCache<T extends Metadata> {
	private cache = new Map<Identifier, T>();
	private lruQueue: Identifier[] = [];

	private updateLRU(id: Identifier) {
		const index = this.lruQueue.indexOf(id);
		if (index > -1) this.lruQueue.splice(index, 1);
		this.lruQueue.push(id);
		if (this.lruQueue.length > LRU_CACHE_SIZE) {
			const evicted = this.lruQueue.shift();
			if (evicted) this.cache.delete(evicted);
		}
	}

	get(id: Identifier): T | undefined {
		const value = this.cache.get(id);
		if (value) this.updateLRU(id);
		return value;
	}

	set(id: Identifier, value: T): void {
		this.cache.set(id, value);
		this.updateLRU(id);
	}

	delete(id: Identifier): void {
		this.cache.delete(id);
		const index = this.lruQueue.indexOf(id);
		if (index > -1) this.lruQueue.splice(index, 1);
	}

	has(id: Identifier): boolean {
		return this.cache.has(id);
	}

	keys(): IterableIterator<Identifier> {
		return this.cache.keys();
	}

	clear(): void {
		this.cache.clear();
		this.lruQueue = [];
	}
}

class MetadataService {
	private tabDataCache = new MetadataCache<TabMetadata>();
	private groupDataCache = new MetadataCache<GroupMetadata>();

	private handleError(operation: string, error: unknown) {
		console.error(`[VerticalTabs] IndexedDB ${operation} failed:`, error);
	}

	private async get<T extends Metadata>(
		cache: MetadataCache<T>,
		type: Table<T>,
		id: Identifier
	): Promise<T | undefined> {
		if (cache.has(id)) return cache.get(id);
		try {
			const metadata = await type.get(id);
			if (metadata) cache.set(id, metadata);
			return metadata;
		} catch (error) {
			this.handleError("read", error);
			return undefined;
		}
	}

	private async batchGet<T extends Metadata>(
		cache: MetadataCache<T>,
		type: Table<T>,
		ids: Identifier[]
	): Promise<Map<Identifier, T>> {
		const result = new Map<Identifier, T>();
		const toFetch: Identifier[] = [];
		for (const id of ids) {
			const cached = cache.get(id);
			if (cached) {
				result.set(id, cached);
			} else {
				toFetch.push(id);
			}
		}
		if (toFetch.length === 0) return result;
		try {
			const fetched = await type.where("id").anyOf(toFetch).toArray();
			for (const metadata of fetched) {
				result.set(metadata.id, metadata);
				cache.set(metadata.id, metadata);
			}
		} catch (error) {
			this.handleError("batch read", error);
		}
		return result;
	}

	private async set<T extends Metadata>(
		cache: MetadataCache<T>,
		type: Table<T>,
		id: Identifier,
		data: PartialMetadata<T>
	): Promise<T | undefined> {
		const existing = cache.get(id) ?? (await type.get(id));
		const fullMetadata = { ...existing, ...data, id } as T;
		cache.set(id, fullMetadata);
		try {
			await type.put(fullMetadata, id);
			return fullMetadata;
		} catch (error) {
			this.handleError("write", error);
			return undefined;
		}
	}

	private async delete<T extends Metadata>(
		cache: MetadataCache<T>,
		type: Table<T>,
		id: Identifier
	): Promise<void> {
		cache.delete(id);
		try {
			await type.delete(id);
		} catch (error) {
			this.handleError("delete", error);
		}
	}

	private async cleanup<T extends Metadata>(
		cache: MetadataCache<T>,
		type: Table<T>,
		activeIDs: Identifier[]
	): Promise<void> {
		for (const id of cache.keys()) {
			if (!activeIDs.includes(id)) {
				cache.delete(id);
			}
		}
		try {
			const allMetadata = await type.toArray();
			const staleIDs = allMetadata
				.filter((metadata) => !activeIDs.includes(metadata.id))
				.map((metadata) => metadata.id);
			if (staleIDs.length > 0) await type.bulkDelete(staleIDs);
		} catch (error) {
			this.handleError("cleanup", error);
		}
	}

	async getTabMetadata(id: Identifier): TabResult {
		return this.get(this.tabDataCache, db.tabMetadata, id);
	}

	async batchGetTabMetadata(ids: Identifier[]): Promise<TabMetadataMap> {
		return this.batchGet(this.tabDataCache, db.tabMetadata, ids);
	}

	async setTabMetadata(id: Identifier, data: TabUpdates): TabResult {
		return this.set(this.tabDataCache, db.tabMetadata, id, data);
	}

	async deleteTabMetadata(id: Identifier): Promise<void> {
		return this.delete(this.tabDataCache, db.tabMetadata, id);
	}

	async cleanupStaleTabMetadata(activeIDs: Identifier[]): Promise<void> {
		await this.cleanup(this.tabDataCache, db.tabMetadata, activeIDs);
	}

	async getGroupMetadata(id: Identifier): GroupResult {
		return this.get(this.groupDataCache, db.groupMetadata, id);
	}

	async batchGetGroupMetadata(ids: Identifier[]): Promise<GroupMetadataMap> {
		return this.batchGet(this.groupDataCache, db.groupMetadata, ids);
	}

	async setGroupMetadata(id: Identifier, data: GroupUpdates): GroupResult {
		return this.set(this.groupDataCache, db.groupMetadata, id, data);
	}

	async deleteGroupMetadata(id: Identifier): Promise<void> {
		return this.delete(this.groupDataCache, db.groupMetadata, id);
	}

	async cleanupStaleGroupMetadata(activeIDs: Identifier[]): Promise<void> {
		await this.cleanup(this.groupDataCache, db.groupMetadata, activeIDs);
	}

	async clearAllMetadata(): Promise<void> {
		this.tabDataCache.clear();
		this.groupDataCache.clear();
		try {
			await db.tabMetadata.clear();
			await db.groupMetadata.clear();
		} catch (error) {
			this.handleError("clear", error);
		}
	}
}

export const metadataService = new MetadataService();
