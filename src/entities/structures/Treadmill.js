import Phaser from 'phaser';
import { Structure } from './Structure.js';

const BELT_SPEED = 40; // pixels per second for items on belt
const DIRECTIONS = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east:  { dx: 1, dy: 0 },
  west:  { dx: -1, dy: 0 }
};

export class Treadmill extends Structure {
  constructor(scene, x, y, direction) {
    super(scene, x, y, `treadmill-${direction}`, {
      type: 'treadmill',
      buildTime: 3000 // 3 seconds
    });

    this.direction = direction;
    this.dir = DIRECTIONS[direction];
    this.items = []; // items currently on this belt segment
    this.nextTargets = []; // array of next belts or structures (supports curves, forks, junctions)
  }

  onBuilt() {
    // Auto-detect connections
    this.scene.beltSystem.registerBelt(this);
  }

  addItem(type, amount) {
    if (!this.built) return;
    const keyMap = {
      powder: 'item-powder',
      carbon: 'item-carbon',
      compressedPowder: 'item-compressed-powder',
      distilCarbon: 'item-distilcarbon',
      diamond: 'item-diamond'
    };

    for (let i = 0; i < amount; i++) {
      const sprite = this.scene.physics.add.sprite(this.x, this.y, keyMap[type]);
      sprite.resourceType = type;
      sprite.resourceAmount = 1;
      sprite.setDepth(4);
      sprite.onBelt = this;
      this.items.push(sprite);
    }
  }

  updateStructure(time, delta) {
    if (!this.built) return;

    const speed = BELT_SPEED * (delta / 1000);

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item.active) {
        this.items.splice(i, 1);
        continue;
      }

      // Move item in belt direction
      item.x += this.dir.dx * speed;
      item.y += this.dir.dy * speed;

      // Check if item has left this belt segment
      const halfW = 16, halfH = 16;
      const outOfBelt =
        item.x < this.x - halfW || item.x > this.x + halfW ||
        item.y < this.y - halfH || item.y > this.y + halfH;

      if (outOfBelt) {
        this.items.splice(i, 1);

        // Filter to active, built targets
        const valid = this.nextTargets.filter(t => {
          if (!t || !t.active) return false;
          if (t.items !== undefined) return t.built; // belt: must be built
          return true; // structure / arsenal
        });

        if (valid.length > 0) {
          // Random distribution for forks
          const chosen = valid[Math.floor(Math.random() * valid.length)];
          if (chosen.items !== undefined) {
            // Next belt — teleport item to its center and continue
            item.x = chosen.x;
            item.y = chosen.y;
            chosen.items.push(item);
            item.onBelt = chosen;
          } else {
            // Deliver to structure / arsenal storage
            const rm = this.scene.resourceManager;
            rm.addResource(chosen.entityId, item.resourceType, item.resourceAmount);
            item.destroy();
          }
        } else {
          // No valid target — drop on ground at belt exit
          item.onBelt = null;
          this.scene.resourceManager.groundItems.add(item);
        }
      }
    }
  }

  /** Add a next destination (belt, industry, or arsenal). Skips duplicates. */
  connectNext(target) {
    if (target && !this.nextTargets.includes(target)) {
      this.nextTargets.push(target);
    }
  }
}
