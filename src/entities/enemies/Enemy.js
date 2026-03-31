import Phaser from 'phaser';
import { audioManager } from '../../systems/AudioManager.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, config) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = config.hp;
    this.maxHp = config.hp;
    this.damage = config.damage;
    this.attackRange = config.range * 100; // r units to pixels (matches R_UNIT)
    this.speed = config.speed;
    this.enemyType = config.type;
    this.attackCooldown = config.attackCooldown || 1000;
    this.lastAttackTime = 0;
    this.setDepth(8);

    // HP label above enemy
    this.hpLabel = scene.add.text(x, y - 20, `HP ${this.hp}/${this.maxHp}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff6666',
      fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(12);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hpLabel) this.hpLabel.setText(`HP ${this.hp}/${this.maxHp}`);
    audioManager.playHit();
    // Strong red flash
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      if (this.active) this.clearTint();
    });
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  die() {
    if (this.hpLabel) this.hpLabel.destroy();
    audioManager.playEnemyDeath();
    // Heal player +2 HP per kill
    const player = this.scene.player;
    if (player && player.alive) {
      player.hp = Math.min(player.hp + 2, player.maxHp);
    }
    if (this.scene.waveManager) {
      this.scene.waveManager.onEnemyKilled(this);
    }
    this.destroy();
  }

  update(time, delta) {
    if (!this.active) return;
    // Track HP label position
    if (this.hpLabel) this.hpLabel.setPosition(this.x, this.y - 20);

    const target = this.getTarget();
    if (!target) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

    if (dist <= this.attackRange) {
      this.setVelocity(0, 0);
      this.tryAttack(time, target);
    } else {
      this.moveToward(target, delta);
    }
  }

  getTarget() {
    return this.scene.player;
  }

  moveToward(target) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
  }

  tryAttack(time, target) {
    if (time - this.lastAttackTime >= this.attackCooldown) {
      this.lastAttackTime = time;
      this.attack(target);
    }
  }

  attack(target) {
    if (target === this.scene.player) {
      this.scene.player.takeDamage(this.damage);
    }
  }
}
