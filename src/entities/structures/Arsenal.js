import Phaser from 'phaser';

/**
 * Arsenal entity — fixed on the map, indestructible.
 * Player interacts by proximity to:
 *  - Pick up any weapon (free, infinite)
 *  - Reload current weapon (consumes resources from arsenal storage)
 */
export class Arsenal {
  constructor(scene, existingSprite) {
    this.scene = scene;
    this.x = existingSprite.x;
    this.y = existingSprite.y;
    this.sprite = existingSprite;
    this.entityId = existingSprite.entityId;
    this.active = true;

    // Register storage for this arsenal
    scene.resourceManager.createStorage(this.entityId);
  }

  /** Check if player is close enough to interact */
  isPlayerInRange(player, range = 80) {
    return Phaser.Math.Distance.Between(
      player.x, player.y, this.x, this.y
    ) <= range;
  }

  /** Reload player's weapon using resources from this arsenal */
  reloadWeapon(player) {
    const weapon = player.weapon;
    if (!weapon || weapon.currentAmmo >= weapon.data.maxAmmo) return 0;

    const rm = this.scene.resourceManager;
    const cost = weapon.data.ammoCost;
    const altCost = weapon.data.ammoCostAlt;
    let loaded = 0;

    while (weapon.currentAmmo < weapon.data.maxAmmo) {
      // Try primary ammo cost first
      if (rm.canAfford(this.entityId, cost)) {
        rm.payCost(this.entityId, cost);
        weapon.currentAmmo++;
        weapon.usingDistil = false;
        loaded++;
      } else if (altCost && rm.canAfford(this.entityId, altCost)) {
        // Try alt cost
        rm.payCost(this.entityId, altCost);
        weapon.currentAmmo++;
        weapon.usingDistil = !!altCost.distilCarbon;
        loaded++;
      } else {
        break; // can't afford any more
      }
    }
    return loaded;
  }

  /** Player deposits all their carried resources into this arsenal */
  depositPlayerResources(player) {
    const rm = this.scene.resourceManager;
    const types = ['powder', 'carbon', 'compressedPowder', 'distilCarbon', 'diamond'];
    let totalDeposited = 0;
    for (const type of types) {
      const ps = rm.getStorage(player.storageId);
      if (!ps) break;
      const amount = ps[type];
      if (amount > 0) {
        const transferred = rm.transfer(player.storageId, this.entityId, type, amount);
        totalDeposited += transferred;
      }
    }
    return totalDeposited;
  }
}
