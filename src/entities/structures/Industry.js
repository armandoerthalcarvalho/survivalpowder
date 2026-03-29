import Phaser from 'phaser';
import { Structure } from './Structure.js';

/**
 * Base Industry class. Subclasses define recipe and build time.
 */
export class Industry extends Structure {
  constructor(scene, x, y, textureKey, config) {
    super(scene, x, y, textureKey, config);

    this.recipe = config.recipe;       // { inputs: {type: amount, ...}, outputs: {type: amount, ...} }
    this.processTime = config.processTime; // ms per conversion cycle
    this.processTimer = 0;
    this.processing = false;
    this.outputBelt = null;
  }

  onBuilt() {
    this.scene.resourceManager.createStorage(this.entityId);
    this._connectNearbyBelts();
  }

  /**
   * Scan all existing built belts and:
   *  - Add this industry to any belt whose output position lands on this industry (input delivery).
   *  - Set this.outputBelt to the closest belt that is NOT pointing at us (output forward).
   */
  _connectNearbyBelts() {
    if (!this.scene.beltSystem) return;
    const inputBelts = new Set();

    for (const belt of this.scene.beltSystem.belts) {
      if (!belt.active || !belt.built) continue;

      // Does this belt's output point at this industry?
      const outX = belt.x + belt.dir.dx * 32;
      const outY = belt.y + belt.dir.dy * 32;
      const toIndustry = Math.abs(outX - this.x) + Math.abs(outY - this.y);
      if (toIndustry < 28) {
        belt.connectNext(this);
        inputBelts.add(belt);
      }
    }

    // Find the closest belt that is NOT an input belt for output routing
    let bestDist = Infinity;
    for (const belt of this.scene.beltSystem.belts) {
      if (!belt.active || !belt.built || inputBelts.has(belt)) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, belt.x, belt.y);
      if (d < 48 && d < bestDist) {
        bestDist = d;
        this.outputBelt = belt;
      }
    }
  }

  connectOutputBelt(belt) {
    this.outputBelt = belt;
  }

  updateStructure(time, delta) {
    if (!this.built) return;

    const rm = this.scene.resourceManager;

    if (!this.processing) {
      // Check if we have enough inputs
      if (rm.canAfford(this.entityId, this.recipe.inputs)) {
        rm.payCost(this.entityId, this.recipe.inputs);
        this.processing = true;
        this.processTimer = 0;
      }
    } else {
      this.processTimer += delta;
      if (this.processTimer >= this.processTime) {
        // Produce outputs
        for (const [type, amount] of Object.entries(this.recipe.outputs)) {
          if (this.outputBelt && this.outputBelt.active && this.outputBelt.built) {
            this.outputBelt.addItem(type, amount);
          } else {
            // Drop on ground
            const ox = this.x + Phaser.Math.Between(-16, 16);
            const oy = this.y + Phaser.Math.Between(-16, 16);
            for (let i = 0; i < amount; i++) {
              rm.spawnGroundItem(ox, oy, type, 1);
            }
          }
        }
        this.processing = false;
        this.processTimer = 0;
      }
    }
  }

  connectOutputBelt(belt) {
    this.outputBelt = belt;
  }
}

// --- Concrete Industries ---

export class CompressionIndustry extends Industry {
  constructor(scene, x, y) {
    super(scene, x, y, 'industry-compression', {
      type: 'compression',
      buildTime: 80000, // 1 minute 20 seconds
      recipe: {
        inputs: { powder: 2 },
        outputs: { compressedPowder: 1 }
      },
      processTime: 3000 // 3s per cycle
    });
  }
}

export class DistillationIndustry extends Industry {
  constructor(scene, x, y) {
    super(scene, x, y, 'industry-distillation', {
      type: 'distillation',
      buildTime: 45000, // 45 seconds
      recipe: {
        inputs: { carbon: 1 },
        outputs: { distilCarbon: 3 }
      },
      processTime: 500
    });
  }
}

export class BiologicalIndustry extends Industry {
  constructor(scene, x, y) {
    super(scene, x, y, 'industry-biological', {
      type: 'biological',
      buildTime: 120000, // 2 minutes
      recipe: {
        inputs: { carbon: 2 },
        outputs: { diamond: 1 }
      },
      processTime: 6000
    });
  }
}
