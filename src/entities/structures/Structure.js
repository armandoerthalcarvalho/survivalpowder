import Phaser from 'phaser';

/**
 * Base class for all buildable structures.
 * Handles build time, pause/resume, and destruction by Scout.
 */
export class Structure extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, config) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.entityId = `struct-${Structure.nextId++}`;
    this.structureType = config.type;
    this.buildTime = config.buildTime; // total build time in ms
    this.buildProgress = 0;            // ms built so far
    this.built = false;
    this.setDepth(3);
    this.setAlpha(0.4); // transparent while building

    // Progress bar
    this.barBg = scene.add.sprite(x, y - 20, 'bar-bg').setDepth(50);
    this.barFill = scene.add.sprite(x - 16, y - 20, 'bar-fill').setDepth(51).setOrigin(0, 0.5);
    this.barFill.displayWidth = 0;
  }

  /** Called each frame while a player is actively building this */
  progressBuild(delta) {
    if (this.built) return;
    this.buildProgress += delta;
    const pct = Math.min(this.buildProgress / this.buildTime, 1);
    this.barFill.displayWidth = 32 * pct;

    if (pct >= 1) {
      this.completeBuild();
    }
  }

  completeBuild() {
    this.built = true;
    this.setAlpha(1);
    this.barBg.destroy();
    this.barFill.destroy();
    this.onBuilt();
  }

  /** Override in subclasses */
  onBuilt() {}

  /** Called by Scout attack — damage is percentage of build time */
  takeScoutDamage(delta) {
    // Scout destroys in ~50% of normal build time
    // So scout DPS = buildTime / (buildTime * 0.5) = 2× per buildTime unit
    const destroyTime = this.buildTime * 0.5;
    this.buildProgress -= delta * (this.buildTime / destroyTime);

    if (this.buildProgress <= 0) {
      this.destroyStructure();
    }
  }

  destroyStructure() {
    if (this.barBg && this.barBg.active) this.barBg.destroy();
    if (this.barFill && this.barFill.active) this.barFill.destroy();
    // Notify scene
    if (this.scene.buildSystem) {
      this.scene.buildSystem.onStructureDestroyed(this);
    }
    this.destroy();
  }

  updateStructure(time, delta) {
    // Override in subclasses for production logic
  }
}

Structure.nextId = 1;
