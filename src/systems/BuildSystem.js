import Phaser from 'phaser';
import { Miner } from '../entities/structures/Miner.js';
import { Treadmill } from '../entities/structures/Treadmill.js';
import { CompressionIndustry, DistillationIndustry, BiologicalIndustry } from '../entities/structures/Industry.js';

/**
 * Manages structure placement, building progress, and the build menu.
 */
export class BuildSystem {
  constructor(scene) {
    this.scene = scene;
    this.structures = [];
    this.currentlyBuilding = null; // structure the player is actively building
    this.placementMode = null;     // what we're about to place
    this.placementGhost = null;    // preview sprite
    this.beltDirection = 'east';   // current belt direction
  }

  startPlacement(type) {
    this.placementMode = type;
    // Create ghost preview
    const keyMap = {
      miner: 'miner',
      treadmill: `treadmill-${this.beltDirection}`,
      compression: 'industry-compression',
      distillation: 'industry-distillation',
      biological: 'industry-biological'
    };
    if (this.placementGhost) this.placementGhost.destroy();
    this.placementGhost = this.scene.add.sprite(0, 0, keyMap[type] || 'miner');
    this.placementGhost.setAlpha(0.5);
    this.placementGhost.setDepth(100);
  }

  cancelPlacement() {
    this.placementMode = null;
    if (this.placementGhost) {
      this.placementGhost.destroy();
      this.placementGhost = null;
    }
  }

  cycleBeltDirection() {
    const dirs = ['east', 'south', 'west', 'north'];
    const idx = dirs.indexOf(this.beltDirection);
    this.beltDirection = dirs[(idx + 1) % dirs.length];
    if (this.placementMode === 'treadmill' && this.placementGhost) {
      this.placementGhost.setTexture(`treadmill-${this.beltDirection}`);
    }
  }

  update(time, delta) {
    // Update ghost position to mouse
    if (this.placementGhost) {
      const pointer = this.scene.input.activePointer;
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.placementGhost.setPosition(worldPoint.x, worldPoint.y);
    }

    // If player is actively building a structure, progress it
    if (this.currentlyBuilding && this.scene.player.isBuilding) {
      this.currentlyBuilding.progressBuild(delta);
      if (this.currentlyBuilding.built) {
        this.scene.player.isBuilding = false;
        this.currentlyBuilding = null;
      }
    }

    // Update all structures
    for (const s of this.structures) {
      if (s.active) {
        s.updateStructure(time, delta);
      }
    }
  }

  handlePlacementClick(worldX, worldY) {
    if (!this.placementMode) return false;

    const type = this.placementMode;
    let structure = null;

    switch (type) {
      case 'miner':
        structure = this.tryPlaceMiner(worldX, worldY);
        break;
      case 'treadmill':
        structure = new Treadmill(this.scene, worldX, worldY, this.beltDirection);
        break;
      case 'compression':
        structure = new CompressionIndustry(this.scene, worldX, worldY);
        break;
      case 'distillation':
        structure = new DistillationIndustry(this.scene, worldX, worldY);
        break;
      case 'biological':
        structure = new BiologicalIndustry(this.scene, worldX, worldY);
        break;
    }

    if (structure) {
      this.structures.push(structure);
      this.cancelPlacement();
      // Start building — player must stay and build
      this.startBuilding(structure);
      return true;
    }
    return false;
  }

  tryPlaceMiner(x, y) {
    // Must be on a deposit
    const deposits = this.scene.mapData.deposits;
    for (const dep of deposits) {
      if (!dep.active || dep.hasMiner) continue;
      const dist = Phaser.Math.Distance.Between(x, y, dep.x, dep.y);
      if (dist < 24) {
        dep.hasMiner = true;
        return new Miner(this.scene, dep.x, dep.y, dep.depositType);
      }
    }
    return null; // no valid deposit nearby
  }

  startBuilding(structure) {
    this.currentlyBuilding = structure;
    this.scene.player.isBuilding = true;
  }

  /** Resume building an incomplete structure */
  resumeBuilding(structure) {
    if (structure.built) return;
    this.currentlyBuilding = structure;
    this.scene.player.isBuilding = true;
  }

  /** Pause building (player walks away or presses cancel) */
  pauseBuilding() {
    this.currentlyBuilding = null;
    this.scene.player.isBuilding = false;
  }

  onStructureDestroyed(structure) {
    const idx = this.structures.indexOf(structure);
    if (idx >= 0) this.structures.splice(idx, 1);
    if (this.currentlyBuilding === structure) {
      this.currentlyBuilding = null;
      this.scene.player.isBuilding = false;
    }
  }
}
