import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

export class Guardian extends Enemy {
  constructor(scene, x, y) {
    const hp = Phaser.Math.Between(5, 10); // still 5-10
    super(scene, x, y, 'enemy-guardian', {
      type: 'guardian',
      hp,
      damage: 3,
      range: 0.5,        // was 1r
      speed: 22,         // was 30
      attackCooldown: 2000  // was 1500ms
    });
  }
}
