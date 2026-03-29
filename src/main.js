import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Remove loading text once Phaser starts
const loadingEl = document.getElementById('loading');

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  callbacks: {
    postBoot: () => {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }
};

try {
  const game = new Phaser.Game(config);
} catch (err) {
  if (loadingEl) loadingEl.textContent = 'ERRO: ' + err.message;
  console.error('Phaser init error:', err);
}
