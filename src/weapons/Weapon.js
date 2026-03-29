import Phaser from 'phaser';
import { R_UNIT, DISTIL_DAMAGE_MULT } from './WeaponData.js';

export class Weapon {
  constructor(scene, owner, data) {
    this.scene = scene;
    this.owner = owner;
    this.data = data;
    this.currentAmmo = 0; // starts empty — must reload at arsenal
    this.lastFireTime = 0;
    this.usingDistil = false; // track if loaded with distilCarbon
  }

  get rangePixels() {
    return this.data.range * R_UNIT;
  }

  get effectiveDamage() {
    const base = this.data.damage;
    return this.usingDistil ? base * DISTIL_DAMAGE_MULT : base;
  }

  canFire(time) {
    return this.currentAmmo > 0 && (time - this.lastFireTime) >= this.data.cooldown;
  }

  fire(time, target) {
    if (!this.canFire(time)) return false;
    this.currentAmmo--;
    this.lastFireTime = time;
    this.createProjectile(target);
    return true;
  }

  /** Fire at a world point {x, y} instead of a sprite */
  fireAtPoint(time, point) {
    if (!this.canFire(time)) return false;
    this.currentAmmo--;
    this.lastFireTime = time;
    this.createProjectile(point);
    return true;
  }

  getBulletTexture() {
    const name = this.data.name;
    if (name === 'Bioweapon') return 'bullet-bio';
    if (name === 'Flamethrower') return 'bullet-flame';
    if (name === 'Sharp') return 'bullet-diamond';
    if (this.usingDistil) return 'bullet-distil';
    return 'bullet';
  }

  createProjectile(target) {
    const textureKey = this.getBulletTexture();
    const bullet = this.scene.physics.add.sprite(this.owner.x, this.owner.y, textureKey);
    bullet.damage = this.effectiveDamage;
    bullet.setDepth(9);

    const angle = Phaser.Math.Angle.Between(
      this.owner.x, this.owner.y,
      target.x, target.y
    );
    const speed = 400;
    bullet.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Muzzle flash — color matches weapon type
    let flashColor = 0xffff00;
    if (textureKey === 'bullet-bio') flashColor = 0x00ff00;
    else if (textureKey === 'bullet-flame') flashColor = 0xff6600;
    else if (textureKey === 'bullet-diamond') flashColor = 0x00ffff;
    else if (textureKey === 'bullet-distil') flashColor = 0xaa44ff;
    const flash = this.scene.add.circle(this.owner.x, this.owner.y, 7, flashColor, 0.9).setDepth(11);
    this.scene.time.delayedCall(80, () => { if (flash.active) flash.destroy(); });

    // Destroy after traveling max range
    const lifetime = (this.rangePixels / speed) * 1000;
    this.scene.time.delayedCall(lifetime, () => {
      if (bullet.active) bullet.destroy();
    });

    // Register bullet in combat system for collision
    if (this.scene.combatSystem) {
      this.scene.combatSystem.registerBullet(bullet);
    }
  }

  reload(amount) {
    this.currentAmmo = Math.min(this.currentAmmo + amount, this.data.maxAmmo);
  }

  fullReload() {
    this.currentAmmo = this.data.maxAmmo;
  }
}
