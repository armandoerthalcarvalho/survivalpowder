import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

export class Eagle extends Enemy {
  constructor(scene, x, y) {
    const hp = Phaser.Math.Between(2, 3);
    const dmg = Phaser.Math.Between(1, 2); // was 2-3
    super(scene, x, y, 'enemy-eagle', {
      type: 'eagle',
      hp,
      damage: dmg,
      range: 1.5,        // was 2r
      speed: 80,         // was 120 — still fast but survivable
      attackCooldown: 1200  // was 800ms
    });
    // Eagle flies — no collision with structures
    this.body.setAllowGravity(false);
  }

  // Eagle flies directly — override to bypass any future obstacle logic
  moveToward(target) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
  }
}
