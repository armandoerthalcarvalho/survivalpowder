import Phaser from 'phaser';
import { WEAPON_DATA } from '../weapons/WeaponData.js';

export class ArsenalUI {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.currentArsenal = null;

    // Background overlay
    this.overlay = scene.add.graphics().setScrollFactor(0).setDepth(300);

    // Title
    this.title = scene.add.text(120, 30, 'ARSENAL', {
      fontSize: '22px', fontFamily: 'monospace', color: '#cc2222', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    // Current weapon info
    this.currentWeaponText = scene.add.text(120, 58, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#00ff88'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    // Weapon buttons
    const weaponKeys = Object.keys(WEAPON_DATA);
    this.weaponButtons = [];

    for (let i = 0; i < weaponKeys.length; i++) {
      const key = weaponKeys[i];
      const data = WEAPON_DATA[key];
      const y = 80 + i * 30;

      const costStr = this.formatCost(data.ammoCost, data.ammoCostAlt);
      const label = `${data.name} | Dmg:${data.damage} Rng:${data.range}r Ammo:${data.maxAmmo} | ${costStr}`;

      const btn = scene.add.text(130, y, label, {
        fontSize: '11px', fontFamily: 'monospace', color: '#cccccc',
        backgroundColor: '#333333', padding: { x: 8, y: 3 }
      }).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true }).setVisible(false);

      btn.weaponKey = key;
      btn.on('pointerdown', () => this.selectWeapon(key));
      btn.on('pointerover', () => btn.setColor('#00ff88'));
      btn.on('pointerout', () => this.resetBtnColor(btn));

      this.weaponButtons.push(btn);
    }

    const btnY = 80 + weaponKeys.length * 30 + 12;

    // Reload button
    this.reloadBtn = scene.add.text(130, btnY, '[ RECARREGAR ARMA ]', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffaa00',
      backgroundColor: '#333333', padding: { x: 12, y: 5 }
    }).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true }).setVisible(false);
    this.reloadBtn.on('pointerdown', () => this.reloadWeapon());

    // Deposit button
    this.depositBtn = scene.add.text(400, btnY, '[ DEPOSITAR RECURSOS ]', {
      fontSize: '13px', fontFamily: 'monospace', color: '#44aaff',
      backgroundColor: '#333333', padding: { x: 12, y: 5 }
    }).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true }).setVisible(false);
    this.depositBtn.on('pointerdown', () => this.depositResources());

    // Close button
    this.closeBtn = scene.add.text(660, 30, '[ X ]', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ff4444',
      padding: { x: 4, y: 2 }
    }).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true }).setVisible(false);
    this.closeBtn.on('pointerdown', () => this.hide());

    // Arsenal storage display
    this.storageText = scene.add.text(130, btnY + 36, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#888888'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    // Player inventory display
    this.playerResText = scene.add.text(130, btnY + 56, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#88aa44'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    // Feedback text
    this.feedbackText = scene.add.text(400, btnY + 80, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffff00', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(301).setVisible(false);
  }

  formatCost(cost, altCost) {
    const parts = [];
    for (const [k, v] of Object.entries(cost)) {
      parts.push(`${v} ${k}`);
    }
    let str = parts.join('+');
    if (altCost) {
      const altParts = [];
      for (const [k, v] of Object.entries(altCost)) {
        altParts.push(`${v} ${k}`);
      }
      str += ` ou ${altParts.join('+')}`;
    }
    return str;
  }

  show(arsenal) {
    this.currentArsenal = arsenal;
    this.visible = true;
    this.overlay.clear();
    this.overlay.fillStyle(0x000000, 0.8);
    this.overlay.fillRect(110, 20, 580, 540);

    this.title.setVisible(true);
    this.currentWeaponText.setVisible(true);
    this.closeBtn.setVisible(true);
    this.reloadBtn.setVisible(true);
    this.depositBtn.setVisible(true);
    this.storageText.setVisible(true);
    this.playerResText.setVisible(true);
    this.feedbackText.setVisible(false);
    for (const btn of this.weaponButtons) btn.setVisible(true);
    this.refreshDisplay();
  }

  hide() {
    this.visible = false;
    this.overlay.clear();
    this.title.setVisible(false);
    this.currentWeaponText.setVisible(false);
    this.closeBtn.setVisible(false);
    this.reloadBtn.setVisible(false);
    this.depositBtn.setVisible(false);
    this.storageText.setVisible(false);
    this.playerResText.setVisible(false);
    this.feedbackText.setVisible(false);
    for (const btn of this.weaponButtons) btn.setVisible(false);
    this.currentArsenal = null;
  }

  resetBtnColor(btn) {
    const player = this.scene.player;
    if (player && player.currentWeaponKey === btn.weaponKey) {
      btn.setColor('#00ff88');
    } else {
      btn.setColor('#cccccc');
    }
  }

  selectWeapon(key) {
    this.scene.player.equipWeapon(key);
    this.showFeedback(`Arma equipada: ${WEAPON_DATA[key].name} (0 munição)`);
    this.refreshDisplay();
  }

  reloadWeapon() {
    if (!this.currentArsenal) return;
    const loaded = this.currentArsenal.reloadWeapon(this.scene.player);
    if (loaded > 0) {
      this.showFeedback(`Recarregou +${loaded} munição!`);
    } else {
      const w = this.scene.player.weapon;
      if (w && w.currentAmmo >= w.data.maxAmmo) {
        this.showFeedback('Munição já está cheia!');
      } else {
        this.showFeedback('Recursos insuficientes no arsenal!');
      }
    }
    this.refreshDisplay();
  }

  depositResources() {
    if (!this.currentArsenal) return;
    const deposited = this.currentArsenal.depositPlayerResources(this.scene.player);
    if (deposited > 0) {
      this.showFeedback(`Depositou ${deposited} recurso(s) no arsenal!`);
    } else {
      this.showFeedback('Nenhum recurso para depositar.');
    }
    this.refreshDisplay();
  }

  showFeedback(msg) {
    this.feedbackText.setText(msg);
    this.feedbackText.setVisible(true);
    // Auto-hide after 2s
    if (this._feedbackTimer) this._feedbackTimer.remove();
    this._feedbackTimer = this.scene.time.delayedCall(2000, () => {
      this.feedbackText.setVisible(false);
    });
  }

  refreshDisplay() {
    if (!this.currentArsenal) return;
    const rm = this.scene.resourceManager;
    const player = this.scene.player;

    // Current weapon
    if (player.weapon) {
      const w = player.weapon;
      this.currentWeaponText.setText(`Equipada: ${w.data.name} | Munição: ${w.currentAmmo}/${w.data.maxAmmo}`);
    }

    // Highlight equipped weapon button
    for (const btn of this.weaponButtons) {
      if (btn.weaponKey === player.currentWeaponKey) {
        btn.setStyle({ backgroundColor: '#224422' });
      } else {
        btn.setStyle({ backgroundColor: '#333333' });
      }
    }

    // Arsenal storage
    const s = rm.getStorage(this.currentArsenal.entityId);
    if (s) {
      this.storageText.setText(
        `Arsenal: Pw:${s.powder} C:${s.carbon} CP:${s.compressedPowder} DC:${s.distilCarbon} Di:${s.diamond}`
      );
    }

    // Player inventory
    const ps = rm.getStorage('player');
    if (ps) {
      const total = rm.totalItems('player');
      this.playerResText.setText(
        `Inventário [${total}/10]: Pw:${ps.powder} C:${ps.carbon} CP:${ps.compressedPowder} DC:${ps.distilCarbon} Di:${ps.diamond}`
      );
    }
  }

  update() {
    if (this.visible) {
      this.refreshDisplay();
    }
  }
}
