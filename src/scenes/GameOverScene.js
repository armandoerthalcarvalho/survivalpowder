import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.finalStage = data.stage || 1;
    this.finalWave = data.wave || 1;
  }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.text(cx, cy - 60, 'GAME OVER', {
      fontSize: '40px',
      fontFamily: 'monospace',
      color: '#ff4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 10, `Estágio ${this.finalStage} — Wave ${this.finalWave}`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#cccccc'
    }).setOrigin(0.5);

    const retryBtn = this.add.text(cx, cy + 70, '[ TENTAR NOVAMENTE ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#00ff88'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#ffffff'));
    retryBtn.on('pointerdown', () => this.scene.start('Game'));
  }
}
