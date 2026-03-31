import Phaser from 'phaser';
import { audioManager } from './AudioManager.js';
import { Terrestrial } from '../entities/enemies/Terrestrial.js';
import { Eagle } from '../entities/enemies/Eagle.js';
import { Guardian } from '../entities/enemies/Guardian.js';
import { Scout } from '../entities/enemies/Scout.js';

const WAVES_PER_STAGE = 6;
const WAVE_INTERVAL = 90000; // 90 seconds between waves
const FIRST_WAVE_DELAY = 45000; // 45s grace period

export class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.stage = 1;
    this.wave = 0; // incremented to 1 on first spawn
    this.wavesPerStage = WAVES_PER_STAGE;
    this.waveInterval = WAVE_INTERVAL;
    this.waveTimer = WAVE_INTERVAL - FIRST_WAVE_DELAY; // first wave comes after grace period
    this.enemiesAlive = 0;
    this.totalKills = 0;
    this.active = false;
  }

  start() {
    this.active = true;
  }

  update(time, delta) {
    if (!this.active) return;

    this.waveTimer += delta;

    if (this.waveTimer >= WAVE_INTERVAL) {
      this.waveTimer -= WAVE_INTERVAL;
      this.spawnWave();
    }
  }

  spawnWave() {
    audioManager.playWaveStart();
    this.wave++;
    if (this.wave > WAVES_PER_STAGE) {
      this.wave = 1;
      this.stage++;
    }

    // +1 HP to player at the start of each wave
    const player = this.scene.player;
    if (player && player.alive) {
      player.hp = Math.min(player.hp + 1, player.maxHp);
    }

    const composition = this.getWaveComposition();

    for (const entry of composition) {
      for (let i = 0; i < entry.count; i++) {
        const pos = this.getSpawnPosition();
        const enemy = this.createEnemy(entry.type, pos.x, pos.y);
        if (enemy) {
          this.scene.combatSystem.registerEnemy(enemy);
          this.enemiesAlive++;
        }
      }
    }
  }

  /**
   * Wave composition per stage, from spec:
   * Stage 1: +1 Terrestrial per wave
   * Stage 2: +1 T/wave + 1 E/G every 2 waves
   * Stage 3: +1 (T/E/G) per wave
   * Stage 4: +1 E/G per wave + Scout at wave 5
   * Stage 5+: +1 (T/E/G) + 1 (E/G/Scout) per wave
   */
  getWaveComposition() {
    const comp = [];
    const s = this.stage;
    const w = this.wave;

    if (s === 1) {
      comp.push({ type: 'terrestrial', count: w });
    } else if (s === 2) {
      comp.push({ type: 'terrestrial', count: w });
      if (w % 2 === 0) {
        const eOrG = Math.random() < 0.5 ? 'eagle' : 'guardian';
        comp.push({ type: eOrG, count: w / 2 });
      }
    } else if (s === 3) {
      const types = ['terrestrial', 'eagle', 'guardian'];
      const type = types[Phaser.Math.Between(0, 2)];
      comp.push({ type, count: w });
    } else if (s === 4) {
      const eOrG = Math.random() < 0.5 ? 'eagle' : 'guardian';
      comp.push({ type: eOrG, count: w });
      if (w === 5) {
        comp.push({ type: 'scout', count: 1 });
      }
    } else {
      // Stage 5+: scaling with stage number
      const scale = s - 4; // extra scaling factor
      const types1 = ['terrestrial', 'eagle', 'guardian'];
      const types2 = ['eagle', 'guardian', 'scout'];
      const t1 = types1[Phaser.Math.Between(0, 2)];
      const t2 = types2[Phaser.Math.Between(0, 2)];
      comp.push({ type: t1, count: w + scale });
      comp.push({ type: t2, count: w + scale });
    }

    return comp;
  }

  createEnemy(type, x, y) {
    switch (type) {
      case 'terrestrial': return new Terrestrial(this.scene, x, y);
      case 'eagle': return new Eagle(this.scene, x, y);
      case 'guardian': return new Guardian(this.scene, x, y);
      case 'scout': return new Scout(this.scene, x, y);
      default: return null;
    }
  }

  getSpawnPosition() {
    const cam = this.scene.cameras.main;
    const margin = 100;

    // Spawn outside camera view
    const side = Phaser.Math.Between(0, 3);
    let x, y;

    switch (side) {
      case 0: // top
        x = Phaser.Math.Between(cam.scrollX - margin, cam.scrollX + cam.width + margin);
        y = cam.scrollY - margin;
        break;
      case 1: // bottom
        x = Phaser.Math.Between(cam.scrollX - margin, cam.scrollX + cam.width + margin);
        y = cam.scrollY + cam.height + margin;
        break;
      case 2: // left
        x = cam.scrollX - margin;
        y = Phaser.Math.Between(cam.scrollY - margin, cam.scrollY + cam.height + margin);
        break;
      case 3: // right
        x = cam.scrollX + cam.width + margin;
        y = Phaser.Math.Between(cam.scrollY - margin, cam.scrollY + cam.height + margin);
        break;
    }

    // Clamp to world bounds
    x = Phaser.Math.Clamp(x, 20, 1980);
    y = Phaser.Math.Clamp(y, 20, 1980);
    return { x, y };
  }

  onEnemyKilled(enemy) {
    this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
    this.totalKills++;
  }
}
