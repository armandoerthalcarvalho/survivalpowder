/**
 * Manages resources per entity. Each structure/entity has its own local storage.
 * The player has a mini-storage (5-10 slots).
 * Resources on the ground are represented as item sprites.
 */
export class ResourceManager {
  constructor(scene) {
    this.scene = scene;
    // Map<entityId, { powder, carbon, compressedPowder, distilCarbon, diamond }>
    this.storages = new Map();
    // Ground items group — must be physics group for overlap detection
    this.groundItems = scene.physics.add.group();
    this.nextId = 1;
  }

  createStorage(entityId, capacity = Infinity) {
    this.storages.set(entityId, {
      powder: 0,
      carbon: 0,
      compressedPowder: 0,
      distilCarbon: 0,
      diamond: 0,
      capacity
    });
    return entityId;
  }

  getStorage(entityId) {
    return this.storages.get(entityId);
  }

  addResource(entityId, type, amount) {
    const storage = this.storages.get(entityId);
    if (!storage) return 0;
    const totalItems = this.totalItems(entityId);
    const canAdd = storage.capacity === Infinity ? amount : Math.min(amount, storage.capacity - totalItems);
    if (canAdd <= 0) return 0;
    storage[type] += canAdd;
    return canAdd;
  }

  removeResource(entityId, type, amount) {
    const storage = this.storages.get(entityId);
    if (!storage) return 0;
    const removed = Math.min(storage[type], amount);
    storage[type] -= removed;
    return removed;
  }

  hasResource(entityId, type, amount) {
    const storage = this.storages.get(entityId);
    if (!storage) return false;
    return storage[type] >= amount;
  }

  /** Check if a recipe's cost can be paid from a storage */
  canAfford(entityId, cost) {
    const storage = this.storages.get(entityId);
    if (!storage) return false;
    for (const [type, amount] of Object.entries(cost)) {
      if ((storage[type] || 0) < amount) return false;
    }
    return true;
  }

  /** Pay a recipe cost from storage. Returns true if successful */
  payCost(entityId, cost) {
    if (!this.canAfford(entityId, cost)) return false;
    for (const [type, amount] of Object.entries(cost)) {
      this.removeResource(entityId, type, amount);
    }
    return true;
  }

  totalItems(entityId) {
    const s = this.storages.get(entityId);
    if (!s) return 0;
    return s.powder + s.carbon + s.compressedPowder + s.distilCarbon + s.diamond;
  }

  /** Spawn a resource item on the ground at (x, y) */
  spawnGroundItem(x, y, type, amount = 1) {
    const keyMap = {
      powder: 'item-powder',
      carbon: 'item-carbon',
      compressedPowder: 'item-compressed-powder',
      distilCarbon: 'item-distilcarbon',
      diamond: 'item-diamond'
    };
    const key = keyMap[type];
    if (!key) return null;

    const item = this.scene.physics.add.sprite(x, y, key);
    item.resourceType = type;
    item.resourceAmount = amount;
    item.setDepth(1);
    this.groundItems.add(item);
    return item;
  }

  /** Transfer resources between two storages */
  transfer(fromId, toId, type, amount) {
    const removed = this.removeResource(fromId, type, amount);
    if (removed > 0) {
      const added = this.addResource(toId, type, removed);
      // If target is full, return excess to source
      if (added < removed) {
        this.addResource(fromId, type, removed - added);
      }
      return added;
    }
    return 0;
  }

  deleteStorage(entityId) {
    this.storages.delete(entityId);
  }
}
