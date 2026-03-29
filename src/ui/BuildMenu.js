import Phaser from 'phaser';

export class BuildMenu {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.buttons = [];

    const items = [
      { key: 'miner', label: '⛏ Miner (20s)', desc: 'Coloque em depósito', color: '#88aa44' },
      { key: 'treadmill', label: '➡ Belt (3s)', desc: 'R=girar direção', color: '#aaaaaa' },
      { key: 'distillation', label: '⚗ Distillation (45s)', desc: '1C → 3DC', color: '#bb66ee' },
      { key: 'compression', label: '🔧 Compression (1m 20s)', desc: '2Pw → 1CP', color: '#6688cc' },
      { key: 'biological', label: '🧬 Biological (2m)', desc: '2C → 1Diamond', color: '#44aa66' }
    ];

    const startX = 610;
    const startY = 5;

    // Background
    this.bg = scene.add.graphics().setScrollFactor(0).setDepth(199);

    // Title
    this.titleText = scene.add.text(startX + 10, startY, '🏗 CONSTRUÇÃO [B]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffcc00', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(201).setVisible(false);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const y = startY + 22 + i * 40;

      const btn = scene.add.text(startX + 10, y, item.label, {
        fontSize: '11px', fontFamily: 'monospace', color: item.color,
        backgroundColor: '#1a1a2e', padding: { x: 6, y: 2 }
      }).setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });

      const descText = scene.add.text(startX + 10, y + 16, item.desc, {
        fontSize: '9px', fontFamily: 'monospace', color: '#666666'
      }).setScrollFactor(0).setDepth(201);

      btn.on('pointerdown', () => {
        scene.buildSystem.startPlacement(item.key);
        this.flash(btn);
        this.toggle(); // auto-close menu when entering placement
      });
      btn.on('pointerover', () => btn.setColor('#ffffff'));
      btn.on('pointerout', () => btn.setColor(item.color));

      btn.setVisible(false);
      descText.setVisible(false);
      this.buttons.push({ btn, descText, origColor: item.color });
    }

    // Toggle hint (always visible)
    this.toggleHint = scene.add.text(startX + 10, startY, '[B] Construir', {
      fontSize: '11px', fontFamily: 'monospace', color: '#666666',
      backgroundColor: '#111111', padding: { x: 6, y: 3 }
    }).setScrollFactor(0).setDepth(201);

    // Toggle key (blocked while arsenal UI is open)
    scene.input.keyboard.on('keydown-B', () => {
      if (scene.arsenalUI && scene.arsenalUI.visible) return;
      this.toggle();
    });
  }

  flash(btn) {
    btn.setColor('#00ff88');
    this.scene.time.delayedCall(200, () => btn.setColor('#ffffff'));
  }

  toggle() {
    this.visible = !this.visible;
    this.titleText.setVisible(this.visible);
    this.toggleHint.setVisible(!this.visible);
    for (const { btn, descText } of this.buttons) {
      btn.setVisible(this.visible);
      descText.setVisible(this.visible);
    }
  }

  update() {
    if (this.visible) {
      this.bg.clear();
      this.bg.fillStyle(0x000000, 0.7);
      this.bg.fillRect(605, 0, 195, 230);
    } else {
      this.bg.clear();
    }
  }
}
