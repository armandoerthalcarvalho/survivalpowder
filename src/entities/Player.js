import Phaser from 'phaser';
import { Weapon } from '../weapons/Weapon.js';
import { WEAPON_DATA } from '../weapons/WeaponData.js';

const PLAYER_SPEED = 150;
const PLAYER_MAX_HP = 10;
const PLAYER_STORAGE_CAPACITY = 10;

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);

    // Stats
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.alive = true;

    // Storage
    this.storageId = 'player';

    // Weapon
    this.weapon = null;
    this.equipWeapon('regular');
    this.weapon.fullReload(); // starting ammo only

    // Combat state
    this.isBuilding = false;
    this.manualTarget = null;

    // Input
    this.cursors = {
      W: scene.input.keyboard.addKey('W'),
      A: scene.input.keyboard.addKey('A'),
      S: scene.input.keyboard.addKey('S'),
      D: scene.input.keyboard.addKey('D')
    };
  }

  equipWeapon(weaponKey) {
    const data = WEAPON_DATA[weaponKey];
    if (!data) return;
    this.weapon = new Weapon(this.scene, this, data);
    // Weapon starts empty — reload at arsenal costs resources
    this.currentWeaponKey = weaponKey;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.die();
    }
  }

  die() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.scene.onPlayerDeath();
  }

  update(time) {
    if (!this.alive) return;

    // Movement (disabled while building)
    let vx = 0, vy = 0;
    if (!this.isBuilding) {
      if (this.cursors.A.isDown) vx = -1;
      if (this.cursors.D.isDown) vx = 1;
      if (this.cursors.W.isDown) vy = -1;
      if (this.cursors.S.isDown) vy = 1;
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      this.setVelocity((vx / len) * PLAYER_SPEED, (vy / len) * PLAYER_SPEED);
    } else {
      this.setVelocity(0, 0);
    }
  }
}
