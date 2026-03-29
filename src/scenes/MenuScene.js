import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.text(cx, cy - 120, 'POWDER SURVIVAL', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, cy - 80, 'Sobreviva. Construa. Automatize.', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const startBtn = this.add.text(cx, cy - 20, '[ INICIAR ]', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#00ff88'));
    startBtn.on('pointerout', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerdown', () => this.scene.start('Game'));

    // Controls help
    const controls = [
      'WASD — Mover personagem',
      'Click — Atirar na direção do mouse',
      'B — Abrir menu de construção',
      'E — Interagir com Arsenal (trocar arma, recarregar)',
      'F — Retomar construção pausada',
      'R — Girar direção do Belt (durante posicionamento)',
      'ESC — Cancelar construção / fechar menus'
    ];

    this.add.text(cx, cy + 50, 'CONTROLES:', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5);

    controls.forEach((line, i) => {
      this.add.text(cx, cy + 70 + i * 18, line, {
        fontSize: '11px', fontFamily: 'monospace', color: '#888888'
      }).setOrigin(0.5);
    });

    this.add.text(cx, cy + 210, 'Minere recursos → Construa belts → Fabrique munição → Sobreviva!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#555555'
    }).setOrigin(0.5);
  }
}
