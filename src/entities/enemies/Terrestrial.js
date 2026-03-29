import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

export class Terrestrial extends Enemy {
  constructor(scene, x, y) {
    const hp = Phaser.Math.Between(2, 4);
    const dmg = 1; // fixed 1 damage (was 1-2)
    super(scene, x, y, 'enemy-terrestrial', {
      type: 'terrestrial',
      hp,
      damage: dmg,
      range: 0.6,       // was 1r — shorter melee reach
      speed: 35,         // was 60 — much slower
      attackCooldown: 1500  // was 1000ms — attacks less often
    });
  }
}
