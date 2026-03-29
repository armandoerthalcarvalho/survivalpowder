import { Treadmill } from '../entities/structures/Treadmill.js';
import { Miner } from '../entities/structures/Miner.js';
import { Industry } from '../entities/structures/Industry.js';

/**
 * Manages belt connections and auto-linking.
 */
export class BeltSystem {
  constructor(scene) {
    this.scene = scene;
    this.belts = [];
  }

  registerBelt(belt) {
    this.belts.push(belt);
    this.autoConnect(belt);
  }

  /** Auto-connect a new belt to adjacent belts/structures */
  autoConnect(belt) {
    const dir = belt.dir;
    // The "output" position of this belt
    const outX = belt.x + dir.dx * 32;
    const outY = belt.y + dir.dy * 32;

    // Connect all entities found at the output position (supports forks)
    const targets = this.findEntitiesAt(outX, outY, belt);
    for (const target of targets) {
      belt.connectNext(target);
    }

    // Also check if any existing belt points INTO this belt (mergers / curves)
    for (const other of this.belts) {
      if (other === belt || !other.active) continue;
      const otherOutX = other.x + other.dir.dx * 32;
      const otherOutY = other.y + other.dir.dy * 32;
      const dist = Math.abs(otherOutX - belt.x) + Math.abs(otherOutY - belt.y);
      if (dist < 24) {
        other.connectNext(belt);
      }
    }

    // Auto-connect nearby miners that don't have an output belt yet
    const structures = this.scene.buildSystem ? this.scene.buildSystem.structures : [];
    for (const s of structures) {
      if (!s.active || !s.built) continue;
      if (s instanceof Miner && !s.outputBelt) {
        const dist = Math.abs(s.x - belt.x) + Math.abs(s.y - belt.y);
        if (dist < 40) {
          s.outputBelt = belt;
        }
      }
      // Auto-connect nearby industries that don't have an output belt,
      // but only if THIS belt is not the one delivering INTO the industry
      if (s instanceof Industry) {
        const outX = belt.x + belt.dir.dx * 32;
        const outY = belt.y + belt.dir.dy * 32;
        const beltPointsAtIndustry = Math.abs(outX - s.x) + Math.abs(outY - s.y) < 28;
        if (!beltPointsAtIndustry) {
          const dist = Math.abs(s.x - belt.x) + Math.abs(s.y - belt.y);
          if (dist < 48 && !s.outputBelt) {
            s.outputBelt = belt;
          }
        }
      }
    }
  }

  /** Return ALL entities at (x,y), excluding the given belt */
  findEntitiesAt(x, y, exclude) {
    const threshold = 24;
    const results = [];

    // Check belts
    for (const b of this.belts) {
      if (b === exclude || !b.active) continue;
      const dist = Math.abs(b.x - x) + Math.abs(b.y - y);
      if (dist < threshold) results.push(b);
    }

    // Check non-belt structures (industries)
    const structures = this.scene.buildSystem ? this.scene.buildSystem.structures : [];
    for (const s of structures) {
      if (s === exclude || !s.active) continue;
      if (s instanceof Treadmill) continue; // already handled above
      const dist = Math.abs(s.x - x) + Math.abs(s.y - y);
      if (dist < threshold) results.push(s);
    }

    // Check arsenals
    if (this.scene.arsenalEntities) {
      for (const a of this.scene.arsenalEntities) {
        const dist = Math.abs(a.x - x) + Math.abs(a.y - y);
        if (dist < threshold) results.push(a);
      }
    }

    return results;
  }

  update(time, delta) {
    // Belt movement is handled by each Treadmill's updateStructure
  }

  removeBelt(belt) {
    const idx = this.belts.indexOf(belt);
    if (idx >= 0) this.belts.splice(idx, 1);
  }
}
