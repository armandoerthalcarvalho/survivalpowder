import Phaser from 'phaser';

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

// Fixed arsenal positions (2 arsenals)
const ARSENAL_POSITIONS = [
  { x: 500, y: 500 },
  { x: 1500, y: 1500 }
];

// Deposit generation config
const NUM_POWDER_DEPOSITS = 12;
const NUM_CARBON_DEPOSITS = 8;
const DEPOSIT_MIN_DIST = 80; // minimum distance between deposits
const EDGE_MARGIN = 100;

export class MapGenerator {
  constructor(scene) {
    this.scene = scene;
    this.deposits = [];
    this.arsenals = [];
  }

  generate() {
    // Set world bounds
    this.scene.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw ground tiles (simple tiled background)
    this.drawGround();

    // Place arsenals at fixed positions
    this.placeArsenals();

    // Generate resource deposits procedurally
    this.generateDeposits();

    // Draw world border
    this.drawBorder();

    return {
      deposits: this.deposits,
      arsenals: this.arsenals,
      width: MAP_WIDTH,
      height: MAP_HEIGHT
    };
  }

  drawGround() {
    const g = this.scene.add.graphics();
    g.setDepth(-10);

    // Base ground color
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Subtle grid for spatial reference
    g.lineStyle(1, 0x222244, 0.3);
    const gridSize = 64;
    for (let x = 0; x <= MAP_WIDTH; x += gridSize) {
      g.lineBetween(x, 0, x, MAP_HEIGHT);
    }
    for (let y = 0; y <= MAP_HEIGHT; y += gridSize) {
      g.lineBetween(0, y, MAP_WIDTH, y);
    }
  }

  drawBorder() {
    const g = this.scene.add.graphics();
    g.setDepth(100);
    g.lineStyle(3, 0xff4444, 0.8);
    g.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  placeArsenals() {
    for (const pos of ARSENAL_POSITIONS) {
      const sprite = this.scene.physics.add.staticSprite(pos.x, pos.y, 'arsenal');
      sprite.entityType = 'arsenal';
      sprite.entityId = `arsenal-${this.arsenals.length}`;
      sprite.setDepth(5);

      // Label
      this.scene.add.text(pos.x, pos.y - 30, 'ARSENAL', {
        fontSize: '10px', fontFamily: 'monospace', color: '#ff6666', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6);

      // "Press E" hint (visible always)
      const hint = this.scene.add.text(pos.x, pos.y + 28, '[E] Interagir', {
        fontSize: '9px', fontFamily: 'monospace', color: '#999999'
      }).setOrigin(0.5).setDepth(6);
      sprite.hintText = hint;

      this.arsenals.push(sprite);
    }
  }

  generateDeposits() {
    const placed = [];

    // Place powder deposits
    for (let i = 0; i < NUM_POWDER_DEPOSITS; i++) {
      const pos = this.findValidPosition(placed);
      if (pos) {
        const deposit = this.createDeposit(pos.x, pos.y, 'powder');
        placed.push(pos);
        this.deposits.push(deposit);
      }
    }

    // Place carbon deposits
    for (let i = 0; i < NUM_CARBON_DEPOSITS; i++) {
      const pos = this.findValidPosition(placed);
      if (pos) {
        const deposit = this.createDeposit(pos.x, pos.y, 'carbon');
        placed.push(pos);
        this.deposits.push(deposit);
      }
    }
  }

  createDeposit(x, y, type) {
    const key = type === 'powder' ? 'deposit-powder' : 'deposit-carbon';
    const sprite = this.scene.physics.add.staticSprite(x, y, key);
    sprite.entityType = 'deposit';
    sprite.depositType = type;
    sprite.hasMiner = false;
    sprite.setDepth(0);
    sprite.setAlpha(0.7);

    // Label showing type
    const label = type === 'powder' ? 'Powder' : 'Carbon';
    const color = type === 'powder' ? '#6699ff' : '#999999';
    this.scene.add.text(x, y - 24, label, {
      fontSize: '9px', fontFamily: 'monospace', color
    }).setOrigin(0.5).setDepth(1);

    return sprite;
  }

  findValidPosition(existing) {
    const maxAttempts = 100;
    for (let i = 0; i < maxAttempts; i++) {
      const x = Phaser.Math.Between(EDGE_MARGIN, MAP_WIDTH - EDGE_MARGIN);
      const y = Phaser.Math.Between(EDGE_MARGIN, MAP_HEIGHT - EDGE_MARGIN);

      // Check distance from other deposits
      let valid = true;
      for (const p of existing) {
        const dist = Phaser.Math.Distance.Between(x, y, p.x, p.y);
        if (dist < DEPOSIT_MIN_DIST) { valid = false; break; }
      }

      // Check distance from arsenals
      if (valid) {
        for (const a of ARSENAL_POSITIONS) {
          const dist = Phaser.Math.Distance.Between(x, y, a.x, a.y);
          if (dist < 60) { valid = false; break; }
        }
      }

      if (valid) return { x, y };
    }
    return null;
  }
}

export { MAP_WIDTH, MAP_HEIGHT };
