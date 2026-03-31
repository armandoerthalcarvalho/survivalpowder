import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { DOC_CONTENT } from './ui/DocContent.js';
import { audioManager } from './systems/AudioManager.js';

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

  // --- Pause System ---
  const pauseBtn = document.getElementById('pause-btn');
  const pauseOverlay = document.getElementById('pause-overlay');
  let isPaused = false;

  function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
      game.scene.pause('Game');
      audioManager.pause();
      pauseOverlay.classList.add('visible');
      pauseBtn.textContent = '▶ Retomar';
      pauseBtn.classList.add('paused');
    } else {
      game.scene.resume('Game');
      audioManager.resume();
      pauseOverlay.classList.remove('visible');
      pauseBtn.textContent = '⏸ Pausar';
      pauseBtn.classList.remove('paused');
    }
  }

  function pauseGame() {
    if (!isPaused) togglePause();
  }

  function resumeGame() {
    if (isPaused) togglePause();
  }

  pauseBtn.addEventListener('click', togglePause);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement === document.body) {
      e.preventDefault();
      togglePause();
    }
  });

  // --- Doc Modal System ---
  const docModal = document.getElementById('doc-modal');
  const docTitle = document.getElementById('doc-modal-title');
  const docBody = document.getElementById('doc-modal-body');
  const docClose = document.getElementById('doc-modal-close');

  function openDoc(key) {
    const content = DOC_CONTENT[key];
    if (!content) return;
    pauseGame();
    docTitle.textContent = content.title;
    docBody.innerHTML = content.body;
    docModal.classList.add('visible');
  }

  function closeDoc() {
    docModal.classList.remove('visible');
  }

  docClose.addEventListener('click', closeDoc);
  document.getElementById('doc-rules-btn').addEventListener('click', () => openDoc('rules'));
  document.getElementById('doc-stats-btn').addEventListener('click', () => openDoc('stats'));
  document.getElementById('doc-tips-btn').addEventListener('click', () => openDoc('tips'));
  document.getElementById('doc-related-btn').addEventListener('click', () => openDoc('related'));

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && docModal.classList.contains('visible')) {
      closeDoc();
    }
  });

  // Expose pause helpers for GameScene auto-save
  window.__powderSurvival = { game, pauseGame, resumeGame, isPaused: () => isPaused };

  // --- Audio Controls ---
  const musicBtn = document.getElementById('music-btn');
  const sfxBtn = document.getElementById('sfx-btn');

  // Initialize audio on first user interaction
  const initAudio = () => {
    audioManager.init();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
  };
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);

  musicBtn.addEventListener('click', () => {
    audioManager.init();
    const on = audioManager.toggleMusic();
    musicBtn.textContent = on ? '🎵 Música: ON' : '🎵 Música: OFF';
  });
  sfxBtn.addEventListener('click', () => {
    audioManager.init();
    const on = audioManager.toggleSfx();
    sfxBtn.textContent = on ? '🔊 SFX: ON' : '🔇 SFX: OFF';
  });

} catch (err) {
  if (loadingEl) loadingEl.textContent = 'ERRO: ' + err.message;
  console.error('Phaser init error:', err);
}
