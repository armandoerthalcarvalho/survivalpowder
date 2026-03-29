import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Nothing to preload — we generate textures in create()
  }

  create() {
    try {
      this.createPlaceholders();
      this.scene.start('Menu');
    } catch (err) {
      console.error('BootScene error:', err);
      this.add.text(10, 10, 'ERRO: ' + err.message, {
        fontSize: '14px', fontFamily: 'monospace', color: '#ff0000'
      });
    }
  }

  createPlaceholders() {
    // Player — green square
    this.makeRect('player', 24, 24, 0x00ff88);

    // Deposits
    this.makeRect('deposit-powder', 32, 32, 0x4488ff);
    this.makeRect('deposit-carbon', 32, 32, 0x555555);

    // Arsenal — red
    this.makeRect('arsenal', 40, 40, 0xcc2222);

    // Structures
    this.makeRect('miner', 28, 28, 0x88aa44);
    this.makeArrowBelt('treadmill-east',  32, 18, 'east');
    this.makeArrowBelt('treadmill-west',  32, 18, 'west');
    this.makeArrowBelt('treadmill-north', 18, 32, 'north');
    this.makeArrowBelt('treadmill-south', 18, 32, 'south');
    this.makeRect('industry-compression', 36, 36, 0x4466aa);
    this.makeRect('industry-distillation', 36, 36, 0x7744aa);
    this.makeRect('industry-biological', 36, 36, 0x44aa66);

    // Enemies
    this.makeRect('enemy-terrestrial', 20, 20, 0xff4444);
    this.makeRect('enemy-eagle', 18, 18, 0xff8800);
    this.makeRect('enemy-guardian', 28, 28, 0xaa00aa);
    this.makeRect('enemy-scout', 22, 22, 0xffff00);

    // Projectiles
    this.makeRect('bullet', 12, 12, 0xffffff);
    this.makeRect('bullet-distil', 12, 12, 0xaa44ff);
    this.makeRect('bullet-bio', 16, 16, 0x00ff00);
    this.makeRect('bullet-flame', 14, 8, 0xff6600);
    this.makeRect('bullet-diamond', 12, 12, 0x00ffff);

    // Resource items on ground
    this.makeRect('item-powder', 8, 8, 0x4488ff);
    this.makeRect('item-carbon', 8, 8, 0x555555);
    this.makeRect('item-compressed-powder', 10, 10, 0x2266dd);
    this.makeRect('item-distilcarbon', 10, 10, 0x7744aa);
    this.makeRect('item-diamond', 10, 10, 0x00ffff);

    // Build progress bar
    this.makeRect('bar-bg', 32, 4, 0x222222);
    this.makeRect('bar-fill', 32, 4, 0x00ff00);
  }

  makeRect(key, w, h, color) {
    const canvas = this.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, w, h);
    canvas.refresh();
  }

  makeArrowBelt(key, w, h, dir) {
    const canvas = this.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    // Background
    ctx.fillStyle = '#445544';
    ctx.fillRect(0, 0, w, h);
    // Border
    ctx.strokeStyle = '#889988';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    // Arrow
    ctx.fillStyle = '#ccffcc';
    const cx = w / 2, cy = h / 2;
    const aw = w * 0.38, ah = h * 0.38; // half-extent of arrow
    ctx.beginPath();
    switch (dir) {
      case 'east':
        ctx.moveTo(cx - aw, cy - ah); ctx.lineTo(cx + aw, cy); ctx.lineTo(cx - aw, cy + ah);
        break;
      case 'west':
        ctx.moveTo(cx + aw, cy - ah); ctx.lineTo(cx - aw, cy); ctx.lineTo(cx + aw, cy + ah);
        break;
      case 'north':
        ctx.moveTo(cx - aw, cy + ah); ctx.lineTo(cx, cy - ah); ctx.lineTo(cx + aw, cy + ah);
        break;
      case 'south':
        ctx.moveTo(cx - aw, cy - ah); ctx.lineTo(cx, cy + ah); ctx.lineTo(cx + aw, cy - ah);
        break;
    }
    ctx.closePath();
    ctx.fill();
    canvas.refresh();
  }
}
