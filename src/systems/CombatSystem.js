import Phaser from 'phaser';

/**
 * Click-to-fire combat system.
 * Left click fires toward mouse cursor (or snaps to nearby enemy).
 * Shows aim line from player to cursor. Range circle always visible.
 */
export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.bulletList = [];   // plain array — physics group was resetting velocity
    this.enemies = scene.physics.add.group();

    // Aim line graphic
    this.aimLine = scene.add.graphics().setDepth(7);

    // Range circle (faint)
    this.rangeCircle = scene.add.graphics().setDepth(6);

    // Note: manual collision check in update() for reliability

    // Click to fire
    scene.input.on('pointerdown', (pointer) => {
      if (!pointer.leftButtonDown()) return;
      // Don't fire if UI is open
      if (this.scene.arsenalUI && this.scene.arsenalUI.visible) return;
      if (this.scene.buildSystem && this.scene.buildSystem.placementMode) return;
      if (this.scene.buildMenu && this.scene.buildMenu.visible && pointer.x > 600) return;
      if (pointer.x > 600 || pointer.y > 560) return;

      this.handleFireClick(pointer);
    });
  }

  registerBullet(bullet) {
    this.bulletList.push(bullet);
  }

  registerEnemy(enemy) {
    this.enemies.add(enemy);
  }

  onBulletHitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    enemy.takeDamage(bullet.damage);
    bullet.destroy();
  }

  handleFireClick(pointer) {
    const player = this.scene.player;
    if (!player || !player.alive || player.isBuilding || !player.weapon) return;

    const time = this.scene.time.now;
    if (!player.weapon.canFire(time)) return;

    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Snap to nearest enemy near the click (within 40px tolerance)
    let targetPoint = { x: worldPoint.x, y: worldPoint.y };
    let snappedEnemy = null;
    let closestDist = 40;

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
        snappedEnemy = enemy;
      }
    });

    if (snappedEnemy) {
      targetPoint = { x: snappedEnemy.x, y: snappedEnemy.y };
    }

    // Check range
    const dist = Phaser.Math.Distance.Between(player.x, player.y, targetPoint.x, targetPoint.y);
    if (dist > player.weapon.rangePixels) {
      // Out of range — show brief red flash on HUD
      this.showOutOfRange();
      return;
    }

    // Fire!
    player.weapon.fireAtPoint(time, targetPoint);
  }

  showOutOfRange() {
    if (this._oorText) return;
    this._oorText = this.scene.add.text(400, 540, 'Fora de alcance!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.scene.time.delayedCall(600, () => {
      if (this._oorText) { this._oorText.destroy(); this._oorText = null; }
    });
  }

  update(time) {
    const player = this.scene.player;
    if (!player || !player.alive || !player.weapon) {
      this.aimLine.clear();
      this.rangeCircle.clear();
      return;
    }

    // Draw range circle
    this.rangeCircle.clear();
    if (!player.isBuilding) {
      this.rangeCircle.lineStyle(1, 0x335555, 0.25);
      this.rangeCircle.strokeCircle(player.x, player.y, player.weapon.rangePixels);
    }

    // Draw aim line from player to mouse cursor
    this.aimLine.clear();
    if (!player.isBuilding) {
      const pointer = this.scene.input.activePointer;
      const worldMouse = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const dist = Phaser.Math.Distance.Between(player.x, player.y, worldMouse.x, worldMouse.y);
      const inRange = dist <= player.weapon.rangePixels;
      const hasAmmo = player.weapon.currentAmmo > 0;

      // Aim line color: green=ready, grey=no ammo, red=out of range
      let color = 0x00ff44;
      if (!hasAmmo) color = 0x444444;
      else if (!inRange) color = 0x664444;

      this.aimLine.lineStyle(1, color, 0.4);
      this.aimLine.lineBetween(player.x, player.y, worldMouse.x, worldMouse.y);

      // Small crosshair at cursor
      this.aimLine.lineStyle(1, color, 0.6);
      this.aimLine.strokeCircle(worldMouse.x, worldMouse.y, 6);

      // Highlight enemies in range
      this.enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const eDist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (eDist <= player.weapon.rangePixels) {
          this.aimLine.lineStyle(1, 0xff4444, 0.3);
          this.aimLine.strokeCircle(enemy.x, enemy.y, 10);
        }
      });
    }

    // --- Manual bullet-enemy collision ---
    const enemies = this.enemies.getChildren();
    for (let i = this.bulletList.length - 1; i >= 0; i--) {
      const bullet = this.bulletList[i];
      if (!bullet || !bullet.active) {
        this.bulletList.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (!enemy || !enemy.active) continue;
        const d = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        if (d < 20) {
          this.onBulletHitEnemy(bullet, enemy);
          hit = true;
          break;
        }
      }
      if (hit) this.bulletList.splice(i, 1);
    }
  }

  findNearestEnemy(player) {
    let nearest = null;
    let nearestDist = player.weapon.rangePixels;

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    });
    return nearest;
  }
}
