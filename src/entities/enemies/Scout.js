import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

export class Scout extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy-scout', {
      type: 'scout',
      hp: 5,             // was 7
      damage: 1,
      range: 0.8,        // was 1r
      speed: 55,         // was 80
      attackCooldown: 800   // was 500ms
    });
    this.targetStructure = null;
  }

  /** Scout prioritizes structures over player */
  getTarget() {
    // Find nearest structure
    if (!this.targetStructure || !this.targetStructure.active) {
      this.targetStructure = this.findNearestStructure();
    }
    // If no structures, target player
    return this.targetStructure || this.scene.player;
  }

  findNearestStructure() {
    const structures = this.scene.buildSystem ? this.scene.buildSystem.structures : [];
    let nearest = null;
    let nearestDist = Infinity;

    for (const s of structures) {
      if (!s.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, s.x, s.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }

  attack(target) {
    if (target === this.scene.player) {
      this.scene.player.takeDamage(this.damage);
    } else if (target.takeScoutDamage) {
      // Damage structure — scout destroys in ~50% of build time
      target.takeScoutDamage(this.attackCooldown);
    }
  }
}
