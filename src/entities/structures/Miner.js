import Phaser from 'phaser';
import { Structure } from './Structure.js';

const POWDER_RATE = 0.2; // per second
const CARBON_RATE = 0.1; // per second

export class Miner extends Structure {
  constructor(scene, x, y, depositType) {
    super(scene, x, y, 'miner', {
      type: 'miner',
      buildTime: 20000 // 20 seconds
    });

    this.depositType = depositType; // 'powder' or 'carbon'
    this.productionRate = depositType === 'powder' ? POWDER_RATE : CARBON_RATE;
    this.productionAccumulator = 0;
    this.outputBelt = null; // reference to connected treadmill
  }

  onBuilt() {
    // Register storage for this miner
    this.scene.resourceManager.createStorage(this.entityId);
    // Auto-connect to an adjacent belt
    this.findOutputBelt();
  }

  /** Look for a belt within 40px and connect output to it */
  findOutputBelt() {
    if (!this.scene.beltSystem) return;
    for (const belt of this.scene.beltSystem.belts) {
      if (!belt.active || !belt.built) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, belt.x, belt.y);
      if (dist < 40) {
        this.outputBelt = belt;
        return;
      }
    }
  }

  updateStructure(time, delta) {
    if (!this.built) return;

    // Produce resources over time
    this.productionAccumulator += (delta / 1000) * this.productionRate;

    while (this.productionAccumulator >= 1) {
      this.productionAccumulator -= 1;
      this.outputResource();
    }
  }

  outputResource() {
    const type = this.depositType;

    if (this.outputBelt && this.outputBelt.active) {
      // Send to belt
      this.outputBelt.addItem(type, 1);
    } else {
      // Drop on ground near miner
      const ox = this.x + Phaser.Math.Between(-16, 16);
      const oy = this.y + Phaser.Math.Between(-16, 16);
      this.scene.resourceManager.spawnGroundItem(ox, oy, type, 1);
    }
  }

  connectBelt(belt) {
    this.outputBelt = belt;
  }
}
