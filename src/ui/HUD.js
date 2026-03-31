import Phaser from 'phaser';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    const s = { fontSize: '13px', fontFamily: 'monospace', color: '#ffffff' };
    const small = { fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa' };

    // ===== TOP-LEFT: Stats =====
    this.bg = scene.add.graphics().setScrollFactor(0).setDepth(199);
    this.hpText = scene.add.text(10, 8, '', s).setScrollFactor(0).setDepth(200);
    this.weaponText = scene.add.text(10, 26, '', s).setScrollFactor(0).setDepth(200);
    this.resText = scene.add.text(10, 44, '', s).setScrollFactor(0).setDepth(200);

    // ===== TOP-CENTER: Wave info =====
    this.waveText = scene.add.text(400, 8, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);
    this.waveTimerText = scene.add.text(400, 28, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff8800'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);
    this.enemyCountText = scene.add.text(400, 46, '', small)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);

    // ===== BUILD STATUS (center screen) =====
    this.buildText = scene.add.text(400, 560, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffaa00', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);

    // ===== BOTTOM: Controls help =====
    this.controlsBg = scene.add.graphics().setScrollFactor(0).setDepth(199);
    this.controlsText = scene.add.text(400, 580, 
      'WASD=mover | Click=atirar | B=construir | E=arsenal | F=retomar | R=girar belt | SPACE=pausar | ESC=cancelar', {
      fontSize: '10px', fontFamily: 'monospace', color: '#666666'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);

    // ===== PROXIMITY PROMPT =====
    this.promptText = scene.add.text(400, 520, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#00ff88',
      backgroundColor: '#000000aa', padding: { x: 8, y: 4 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);
  }

  update() {
    const player = this.scene.player;
    const wm = this.scene.waveManager;
    const rm = this.scene.resourceManager;

    // --- HP ---
    const hpBar = '█'.repeat(player.hp) + '░'.repeat(player.maxHp - player.hp);
    this.hpText.setText(`HP: ${hpBar} ${player.hp}/${player.maxHp}`);
    this.hpText.setColor(player.hp <= 3 ? '#ff4444' : '#00ff88');

    // --- Weapon ---
    if (player.weapon) {
      const w = player.weapon;
      const ammoBar = '■'.repeat(w.currentAmmo) + '□'.repeat(w.data.maxAmmo - w.currentAmmo);
      this.weaponText.setText(`${w.data.name}: ${ammoBar} ${w.currentAmmo}/${w.data.maxAmmo}`);
      this.weaponText.setColor(w.currentAmmo === 0 ? '#ff4444' : '#ffffff');
    } else {
      this.weaponText.setText('Sem arma');
    }

    // --- Resources ---
    const ps = rm.getStorage('player');
    if (ps) {
      const parts = [];
      parts.push(`Pw:${ps.powder}`);
      parts.push(`C:${ps.carbon}`);
      if (ps.compressedPowder > 0) parts.push(`CP:${ps.compressedPowder}`);
      if (ps.distilCarbon > 0) parts.push(`DC:${ps.distilCarbon}`);
      if (ps.diamond > 0) parts.push(`Di:${ps.diamond}`);
      const total = rm.totalItems('player');
      this.resText.setText(`Inv [${total}/10]: ${parts.join(' ')}`);
    }

    // --- Wave info ---
    if (wm) {
      if (wm.wave === 0) {
        this.waveText.setText('Preparando...');
        this.waveText.setColor('#aaaaaa');
      } else {
        this.waveText.setText(`Estágio ${wm.stage} — Wave ${wm.wave}/${wm.wavesPerStage}`);
        this.waveText.setColor('#ffcc00');
      }

      // Countdown to next wave
      const remaining = Math.max(0, Math.ceil((wm.waveInterval - wm.waveTimer) / 1000));
      this.waveTimerText.setText(wm.wave === 0 ? `Primeira wave em ${remaining}s` : `Próxima wave: ${remaining}s`);

      this.enemyCountText.setText(`Inimigos vivos: ${wm.enemiesAlive}`);
    }

    // --- Build status ---
    if (player.isBuilding && this.scene.buildSystem.currentlyBuilding) {
      const s = this.scene.buildSystem.currentlyBuilding;
      const pct = Math.floor((s.buildProgress / s.buildTime) * 100);
      this.buildText.setText(`⚙ Construindo ${s.structureType}... ${pct}% [ESC cancela]`);
      this.buildText.setVisible(true);
    } else if (this.scene.buildSystem.placementMode) {
      this.buildText.setText(`Modo construção: ${this.scene.buildSystem.placementMode} — clique para posicionar`);
      this.buildText.setVisible(true);
    } else {
      this.buildText.setVisible(false);
    }

    // --- Proximity prompt ---
    this.updatePrompt(player);

    // --- Background panels ---
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.6);
    this.bg.fillRect(0, 0, 320, 62);

    this.controlsBg.clear();
    this.controlsBg.fillStyle(0x000000, 0.5);
    this.controlsBg.fillRect(0, 575, 800, 25);
  }

  updatePrompt(player) {
    // Check proximity to arsenals
    for (const arsenal of this.scene.arsenalEntities) {
      if (arsenal.isPlayerInRange(player, 100)) {
        this.promptText.setText('▶ Pressione [E] para abrir Arsenal');
        this.promptText.setVisible(true);
        return;
      }
    }

    // Check proximity to incomplete structures
    const structures = this.scene.buildSystem.structures;
    for (const s of structures) {
      if (!s.active || s.built) continue;
      const dist = Phaser.Math.Distance.Between(player.x, player.y, s.x, s.y);
      if (dist < 60) {
        const pct = Math.floor((s.buildProgress / s.buildTime) * 100);
        this.promptText.setText(`▶ Pressione [F] para continuar construção (${pct}%)`);
        this.promptText.setVisible(true);
        return;
      }
    }

    // Check proximity to deposits
    for (const dep of this.scene.mapData.deposits) {
      if (!dep.active || dep.hasMiner) continue;
      const dist = Phaser.Math.Distance.Between(player.x, player.y, dep.x, dep.y);
      if (dist < 50) {
        this.promptText.setText(`▶ ${dep.depositType === 'powder' ? 'Powder' : 'Carbon'} — use [B] > Miner para minerar`);
        this.promptText.setVisible(true);
        return;
      }
    }

    this.promptText.setVisible(false);
  }
}
