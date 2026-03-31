import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { MapGenerator } from '../map/MapGenerator.js';
import { ResourceManager } from '../systems/ResourceManager.js';
import { BuildSystem } from '../systems/BuildSystem.js';
import { BeltSystem } from '../systems/BeltSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { WaveManager } from '../systems/WaveManager.js';
import { Arsenal } from '../entities/structures/Arsenal.js';
import { HUD } from '../ui/HUD.js';
import { BuildMenu } from '../ui/BuildMenu.js';
import { ArsenalUI } from '../ui/ArsenalUI.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    try {
      this._doCreate();
    } catch (err) {
      console.error('GameScene create error:', err);
      this.add.text(10, 10, 'ERRO no GameScene: ' + err.message, {
        fontSize: '14px', fontFamily: 'monospace', color: '#ff0000'
      });
    }
  }

  _doCreate() {
    // --- Systems ---
    this.resourceManager = new ResourceManager(this);
    this.beltSystem = new BeltSystem(this);
    this.buildSystem = new BuildSystem(this);

    // --- Map ---
    const mapGen = new MapGenerator(this);
    this.mapData = mapGen.generate();

    // --- Player --- (spawn near first arsenal)
    this.player = new Player(this, 500, 520);
    this.resourceManager.createStorage('player', 10); // mini-storage

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.mapData.width, this.mapData.height);

    // --- Arsenal entities ---
    this.arsenalEntities = [];
    for (const sprite of this.mapData.arsenals) {
      const arsenal = new Arsenal(this, sprite);
      this.arsenalEntities.push(arsenal);
    }

    // Give arsenals starting resources so player can reload early
    for (const arsenal of this.arsenalEntities) {
      this.resourceManager.addResource(arsenal.entityId, 'powder', 30);
      this.resourceManager.addResource(arsenal.entityId, 'carbon', 15);
    }

    // --- Combat ---
    this.combatSystem = new CombatSystem(this);

    // --- Waves ---
    this.waveManager = new WaveManager(this);
    this.waveManager.start();

    // --- UI ---
    this.hud = new HUD(this);
    this.buildMenu = new BuildMenu(this);
    this.arsenalUI = new ArsenalUI(this);

    // --- Input ---
    this.setupInput();

    // --- Player pickup overlap ---
    this.physics.add.overlap(
      this.player,
      this.resourceManager.groundItems,
      this.onPlayerPickupItem,
      null,
      this
    );

    // --- Load saved game ---
    this.loadGame();

    // --- Auto-save every 30 seconds ---
    this._autoSaveTimer = this.time.addEvent({
      delay: 30000,
      callback: () => this.saveGame(),
      loop: true
    });
  }

  setupInput() {
    // ESC — cancel building or close UI
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.arsenalUI.visible) {
        this.arsenalUI.hide();
      } else if (this.buildSystem.placementMode) {
        this.buildSystem.cancelPlacement();
      } else if (this.player.isBuilding) {
        this.buildSystem.pauseBuilding();
      }
    });

    // R — rotate belt direction
    this.input.keyboard.on('keydown-R', () => {
      if (this.buildSystem.placementMode === 'treadmill') {
        this.buildSystem.cycleBeltDirection();
      }
    });

    // E — interact with arsenal (if nearby)
    this.input.keyboard.on('keydown-E', () => {
      if (this.arsenalUI.visible) {
        this.arsenalUI.hide();
        return;
      }
      for (const arsenal of this.arsenalEntities) {
        if (arsenal.isPlayerInRange(this.player)) {
          this.arsenalUI.show(arsenal);
          return;
        }
      }
    });

    // F — interact with incomplete structure (resume building)
    this.input.keyboard.on('keydown-F', () => {
      if (this.player.isBuilding) return;
      const structures = this.buildSystem.structures;
      for (const s of structures) {
        if (!s.active || s.built) continue;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
        if (dist < 50) {
          this.buildSystem.resumeBuilding(s);
          return;
        }
      }
    });

    // Left click — placement only (combat click handled by CombatSystem)
    this.input.on('pointerdown', (pointer) => {
      if (this.arsenalUI.visible) return; // UI absorbs click
      if (pointer.x > 600) return;
      if (pointer.y > 560) return;

      if (pointer.leftButtonDown() && this.buildSystem.placementMode) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.buildSystem.handlePlacementClick(worldPoint.x, worldPoint.y);
      }
    });
  }

  onPlayerPickupItem(player, item) {
    if (!item.active) return;
    const rm = this.resourceManager;
    const added = rm.addResource('player', item.resourceType, item.resourceAmount);
    if (added > 0) {
      item.resourceAmount -= added;
      if (item.resourceAmount <= 0) {
        rm.groundItems.remove(item, true, true);
      }
      // Pickup flash
      const flash = this.add.text(player.x, player.y - 20, `+${added} ${item.resourceType}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#00ff88'
      }).setOrigin(0.5).setDepth(50);
      this.tweens.add({
        targets: flash, y: flash.y - 20, alpha: 0, duration: 600,
        onComplete: () => flash.destroy()
      });
    }
  }

  onPlayerDeath() {
    this.waveManager.active = false;
    // Clear saved game on death
    try { localStorage.removeItem('powderSurvival_save'); } catch(e) {}
    this.scene.start('GameOver', {
      stage: this.waveManager.stage,
      wave: this.waveManager.wave
    });
  }

  // === SAVE / LOAD SYSTEM ===

  saveGame() {
    try {
      const rm = this.resourceManager;
      const wm = this.waveManager;

      // Serialize all storages
      const storages = {};
      for (const [id, s] of rm.storages) {
        storages[id] = { ...s };
      }

      const save = {
        version: 1,
        timestamp: Date.now(),
        player: {
          x: this.player.x,
          y: this.player.y,
          hp: this.player.hp,
          weaponKey: this.player.currentWeaponKey,
          ammo: this.player.weapon ? this.player.weapon.currentAmmo : 0
        },
        wave: {
          stage: wm.stage,
          wave: wm.wave,
          waveTimer: wm.waveTimer,
          totalKills: wm.totalKills
        },
        storages
      };

      localStorage.setItem('powderSurvival_save', JSON.stringify(save));
    } catch(e) {
      console.warn('Auto-save failed:', e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('powderSurvival_save');
      if (!raw) return;
      const save = JSON.parse(raw);
      if (!save || save.version !== 1) return;

      // Restore player
      this.player.setPosition(save.player.x, save.player.y);
      this.player.hp = save.player.hp;
      if (save.player.weaponKey) {
        this.player.equipWeapon(save.player.weaponKey);
        this.player.weapon.currentAmmo = save.player.ammo || 0;
      }

      // Restore wave manager
      const wm = this.waveManager;
      wm.stage = save.wave.stage;
      wm.wave = save.wave.wave;
      wm.waveTimer = save.wave.waveTimer;
      wm.totalKills = save.wave.totalKills;

      // Restore storages
      const rm = this.resourceManager;
      for (const [id, s] of Object.entries(save.storages)) {
        if (rm.storages.has(id)) {
          const existing = rm.storages.get(id);
          existing.powder = s.powder || 0;
          existing.carbon = s.carbon || 0;
          existing.compressedPowder = s.compressedPowder || 0;
          existing.distilCarbon = s.distilCarbon || 0;
          existing.diamond = s.diamond || 0;
        }
      }
    } catch(e) {
      console.warn('Load failed:', e);
    }
  }

  update(time, delta) {
    if (!this.player || !this.player.alive) return;

    // Update player
    this.player.update(time);

    // Update systems
    this.buildSystem.update(time, delta);
    this.beltSystem.update(time, delta);
    this.combatSystem.update(time);
    this.waveManager.update(time, delta);

    // Update all enemies
    this.combatSystem.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update(time, delta);
    });

    // Update UI
    this.hud.update();
    this.buildMenu.update();
    this.arsenalUI.update();
  }
}
