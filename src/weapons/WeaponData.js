// All weapon stats from the spec — single source of truth
// Range and damage use 'r' unit (1r ≈ 50px in game world)
export const R_UNIT = 100; // 1r in pixels

export const WEAPON_DATA = {
  regular: {
    name: 'Regular',
    range: 1,
    damage: 1,
    maxAmmo: 7,
    ammoCost: { powder: 1 },
    cooldown: 500     // ms
  },
  double: {
    name: 'Double',
    range: 1.2,
    damage: 2,
    maxAmmo: 4,
    ammoCost: { powder: 2 },
    cooldown: 800
  },
  longgun: {
    name: 'Longgun',
    range: 2.5,
    damage: 2.5,
    maxAmmo: 3,
    ammoCost: { compressedPowder: 1 }, // OR 4 powder — handled in reload logic
    ammoCostAlt: { powder: 4 },
    cooldown: 1500
  },
  pocket: {
    name: 'Pocket',
    range: 0.5,
    damage: 1,
    maxAmmo: 12,
    ammoCost: { carbon: 1 }, // OR distilCarbon — handled in reload
    ammoCostAlt: { distilCarbon: 1 },
    cooldown: 200
  },
  carrier: {
    name: 'Carrier',
    range: 1,
    damage: 1,
    maxAmmo: 20,
    ammoCost: { powder: 1 },
    cooldown: 1000
  },
  heavyCarrier: {
    name: 'Heavy Carrier',
    range: 1,
    damage: 2,
    maxAmmo: 20,
    ammoCost: { compressedPowder: 1 },
    ammoCostAlt: { powder: 4 },
    cooldown: 1500
  },
  bioweapon: {
    name: 'Bioweapon',
    range: 5,
    damage: 10,
    maxAmmo: 1,
    ammoCost: { carbon: 2 },
    ammoCostAlt: { distilCarbon: 2 },
    cooldown: 10000
  },
  sharp: {
    name: 'Sharp',
    range: 1,
    damage: 3,
    maxAmmo: 12,
    ammoCost: { diamond: 1 },
    cooldown: 400
  },
  flamethrower: {
    name: 'Flamethrower',
    range: 0.8,
    damage: 2,
    maxAmmo: 5,
    ammoCost: { carbon: 1 },
    ammoCostAlt: { distilCarbon: 1 },
    cooldown: 100
  }
};

// DistilCarbon does -20% damage
export const DISTIL_DAMAGE_MULT = 0.8;
