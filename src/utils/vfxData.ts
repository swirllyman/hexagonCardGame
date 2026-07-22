import type { Card, CardType, AbilityVFXConfig } from '../types/game';

export const CARD_VFX_CONFIGS: Partial<Record<CardType, AbilityVFXConfig>> = {
  // Fireball / Flame Blast
  fireball: {
    travelTimeMs: 450,
    windupTimeMs: 150,
    impactTimeMs: 300,
    lineRenderer: { style: 'beam', color: '#f97316', glowColor: '#ef4444', width: 7 },
    particles: [
      { type: 'fire_sparks', color: '#f97316', count: 35 },
      { type: 'energy_gather', color: '#fbbf24', count: 15 },
    ],
    screenShake: { intensity: 'medium', durationMs: 300 },
    colorFlash: { color: '#f97316', opacity: 0.25, durationMs: 250 },
    hasShockwaveRipple: true,
  },

  // Thunder Bolt
  thunder: {
    travelTimeMs: 220,
    windupTimeMs: 100,
    impactTimeMs: 250,
    lineRenderer: { style: 'lightning', color: '#38bdf8', glowColor: '#818cf8', width: 6 },
    particles: [
      { type: 'electric_arcs', color: '#38bdf8', count: 40 },
    ],
    screenShake: { intensity: 'medium', durationMs: 200 },
    colorFlash: { color: '#38bdf8', opacity: 0.3, durationMs: 200 },
  },

  // Chain Lightning
  chain_lightning: {
    travelTimeMs: 380,
    windupTimeMs: 150,
    impactTimeMs: 350,
    lineRenderer: { style: 'lightning', color: '#c084fc', glowColor: '#a855f7', width: 7 },
    particles: [
      { type: 'electric_arcs', color: '#e879f9', count: 50 },
    ],
    screenShake: { intensity: 'heavy', durationMs: 350 },
    colorFlash: { color: '#a855f7', opacity: 0.35, durationMs: 300 },
    hasShockwaveRipple: true,
  },

  // Scorpion Pull / Harpoon Whip
  scorpion_pull: {
    travelTimeMs: 420,
    windupTimeMs: 100,
    impactTimeMs: 300,
    lineRenderer: { style: 'chain', color: '#fbbf24', glowColor: '#d97706', width: 5 },
    particles: [
      { type: 'dust_debris', color: '#d97706', count: 30 },
      { type: 'vortex_implode', color: '#f59e0b', count: 20 },
    ],
    screenShake: { intensity: 'medium', durationMs: 250 },
  },

  // Hook Shot
  hook_shot: {
    travelTimeMs: 380,
    windupTimeMs: 100,
    impactTimeMs: 250,
    lineRenderer: { style: 'chain', color: '#38bdf8', glowColor: '#0284c7', width: 4 },
    particles: [
      { type: 'electric_arcs', color: '#38bdf8', count: 25 },
      { type: 'dust_debris', color: '#64748b', count: 15 },
    ],
    screenShake: { intensity: 'mild', durationMs: 200 },
  },

  // Gravitational Surge / Vortex Pull
  gravitational_surge: {
    travelTimeMs: 480,
    windupTimeMs: 150,
    impactTimeMs: 350,
    particles: [
      { type: 'vortex_implode', color: '#a855f7', count: 55 },
      { type: 'electric_arcs', color: '#c084fc', count: 20 },
    ],
    screenShake: { intensity: 'heavy', durationMs: 400 },
    colorFlash: { color: '#9333ea', opacity: 0.3, durationMs: 350 },
    hasShockwaveRipple: true,
  },

  // Cleave Arc / Blasphemous Burst
  blasphemous_burst: {
    travelTimeMs: 280,
    windupTimeMs: 100,
    impactTimeMs: 250,
    lineRenderer: { style: 'cleave_arc', color: '#f43f5e', glowColor: '#fb7185', width: 8 },
    particles: [
      { type: 'blood_drops', color: '#e11d48', count: 35 },
      { type: 'fire_sparks', color: '#f43f5e', count: 20 },
    ],
    screenShake: { intensity: 'medium', durationMs: 250 },
  },

  // Supernova
  supernova: {
    travelTimeMs: 500,
    windupTimeMs: 200,
    impactTimeMs: 450,
    lineRenderer: { style: 'shockwave_ring', color: '#ef4444', glowColor: '#f97316', width: 10 },
    particles: [
      { type: 'fire_sparks', color: '#f97316', count: 65 },
      { type: 'shockwave_rings', color: '#ef4444', count: 35 },
    ],
    screenShake: { intensity: 'heavy', durationMs: 500 },
    colorFlash: { color: '#ef4444', opacity: 0.45, durationMs: 400 },
    hasShockwaveRipple: true,
  },

  // Frost Nova / Frost Burst
  frost_nova: {
    travelTimeMs: 400,
    windupTimeMs: 100,
    impactTimeMs: 350,
    lineRenderer: { style: 'shockwave_ring', color: '#38bdf8', glowColor: '#0284c7', width: 8 },
    particles: [
      { type: 'ice_crystals', color: '#7dd3fc', count: 50 },
      { type: 'shockwave_rings', color: '#38bdf8', count: 20 },
    ],
    screenShake: { intensity: 'medium', durationMs: 300 },
    colorFlash: { color: '#38bdf8', opacity: 0.35, durationMs: 300 },
    hasShockwaveRipple: true,
  },

  // Seismic Slam
  seismic_slam: {
    travelTimeMs: 350,
    windupTimeMs: 150,
    impactTimeMs: 350,
    lineRenderer: { style: 'shockwave_ring', color: '#d97706', glowColor: '#b45309', width: 9 },
    particles: [
      { type: 'dust_debris', color: '#d97706', count: 45 },
      { type: 'shockwave_rings', color: '#78350f', count: 25 },
    ],
    screenShake: { intensity: 'heavy', durationMs: 450 },
    colorFlash: { color: '#b45309', opacity: 0.25, durationMs: 300 },
    hasShockwaveRipple: true,
  },

  // Vampiric Strike
  vampiric: {
    travelTimeMs: 380,
    windupTimeMs: 100,
    impactTimeMs: 300,
    lineRenderer: { style: 'siphon', color: '#dc2626', glowColor: '#7f1d1d', width: 6 },
    particles: [
      { type: 'blood_drops', color: '#ef4444', count: 40 },
    ],
    screenShake: { intensity: 'mild', durationMs: 200 },
    colorFlash: { color: '#991b1b', opacity: 0.25, durationMs: 250 },
  },

  // Whirlwind & Blade Storm
  whirlwind: {
    travelTimeMs: 320,
    windupTimeMs: 100,
    impactTimeMs: 300,
    lineRenderer: { style: 'shockwave_ring', color: '#cbd5e1', glowColor: '#94a3b8', width: 6 },
    particles: [
      { type: 'dust_debris', color: '#94a3b8', count: 35 },
    ],
    screenShake: { intensity: 'mild', durationMs: 200 },
  },
  blade_storm: {
    travelTimeMs: 420,
    windupTimeMs: 100,
    impactTimeMs: 400,
    lineRenderer: { style: 'shockwave_ring', color: '#38bdf8', glowColor: '#0284c7', width: 8 },
    particles: [
      { type: 'dust_debris', color: '#38bdf8', count: 50 },
      { type: 'electric_arcs', color: '#7dd3fc', count: 20 },
    ],
    screenShake: { intensity: 'medium', durationMs: 350 },
  },

  // Basic Movement & Turns (Super simple, subtle ground dust puff, no line renderers or ghost trails)
  move1: {
    travelTimeMs: 200,
    particles: [{ type: 'dust_debris', color: '#94a3b8', count: 5, spreadRadius: 10 }],
  },
  move2: {
    travelTimeMs: 220,
    particles: [{ type: 'dust_debris', color: '#94a3b8', count: 5, spreadRadius: 12 }],
  },
  sidestep: {
    travelTimeMs: 200,
    particles: [{ type: 'dust_debris', color: '#94a3b8', count: 5, spreadRadius: 10 }],
  },
  pivot_left: {
    travelTimeMs: 150,
    particles: [{ type: 'dust_debris', color: '#64748b', count: 4, spreadRadius: 8 }],
  },
  pivot_right: {
    travelTimeMs: 150,
    particles: [{ type: 'dust_debris', color: '#64748b', count: 4, spreadRadius: 8 }],
  },
  about_face: {
    travelTimeMs: 180,
    particles: [{ type: 'dust_debris', color: '#64748b', count: 4, spreadRadius: 8 }],
  },
  backstep: {
    travelTimeMs: 200,
    particles: [{ type: 'dust_debris', color: '#94a3b8', count: 5, spreadRadius: 10 }],
  },
  sidestep_evasion: {
    travelTimeMs: 200,
    particles: [{ type: 'dust_debris', color: '#94a3b8', count: 5, spreadRadius: 10 }],
  },
  ghost_strafe: {
    travelTimeMs: 200,
    particles: [{ type: 'dust_debris', color: '#94a3b8', count: 5, spreadRadius: 10 }],
  },
  backflip_vault: {
    travelTimeMs: 220,
    particles: [{ type: 'dust_debris', color: '#94a3b8', count: 5, spreadRadius: 10 }],
  },
  tumble_roll: {
    travelTimeMs: 220,
    particles: [{ type: 'dust_debris', color: '#94a3b8', count: 6, spreadRadius: 12 }],
  },

  // Advanced Movement Abilities (Dashes, Blinks, Leaps)
  dash_forward: {
    travelTimeMs: 300,
    lineRenderer: { style: 'dash_stream', color: '#34d399', glowColor: '#059669', width: 4 },
    particles: [{ type: 'dust_debris', color: '#34d399', count: 12 }],
  },
  bulwark_charge: {
    travelTimeMs: 350,
    lineRenderer: { style: 'dash_stream', color: '#f59e0b', glowColor: '#d97706', width: 5 },
    particles: [{ type: 'dust_debris', color: '#f59e0b', count: 15 }],
    screenShake: { intensity: 'mild', durationMs: 200 },
  },
  phase_blink: {
    travelTimeMs: 220,
    particles: [{ type: 'shadow_mist', color: '#c084fc', count: 15 }],
  },
  shadow_step: {
    travelTimeMs: 250,
    particles: [{ type: 'shadow_mist', color: '#a855f7', count: 20 }],
  },
  warp_leap: {
    travelTimeMs: 300,
    lineRenderer: { style: 'dash_stream', color: '#38bdf8', glowColor: '#0284c7', width: 4 },
    particles: [{ type: 'holy_glow', color: '#7dd3fc', count: 15 }],
  },
  sky_vault: {
    travelTimeMs: 320,
    lineRenderer: { style: 'dash_stream', color: '#fbbf24', glowColor: '#d97706', width: 4 },
    particles: [{ type: 'holy_glow', color: '#fef08a', count: 15 }],
  },

  // Defense & Buffs
  shield: {
    travelTimeMs: 250,
    particles: [{ type: 'holy_glow', color: '#38bdf8', count: 30 }],
    colorFlash: { color: '#0284c7', opacity: 0.15, durationMs: 200 },
  },
  iron_wall: {
    travelTimeMs: 300,
    particles: [{ type: 'holy_glow', color: '#fbbf24', count: 35 }],
    colorFlash: { color: '#d97706', opacity: 0.2, durationMs: 250 },
    screenShake: { intensity: 'mild', durationMs: 200 },
  },
  meditate: {
    travelTimeMs: 300,
    particles: [{ type: 'holy_glow', color: '#34d399', count: 35 }],
    colorFlash: { color: '#10b981', opacity: 0.2, durationMs: 250 },
  },
  sanctuary: {
    travelTimeMs: 350,
    particles: [{ type: 'holy_glow', color: '#34d399', count: 50 }],
    colorFlash: { color: '#059669', opacity: 0.25, durationMs: 300 },
  },
};

export function getAbilityVFXConfig(card: Card | null): AbilityVFXConfig {
  if (!card) {
    return {
      travelTimeMs: 200,
      windupTimeMs: 50,
      impactTimeMs: 150,
    };
  }

  const customConfig = CARD_VFX_CONFIGS[card.type];
  if (customConfig) {
    return customConfig;
  }

  // Fallback defaults by category and facing type
  if (card.category === 'attack') {
    if (card.facingAttackType === 'line') {
      return {
        travelTimeMs: 350,
        windupTimeMs: 100,
        impactTimeMs: 250,
        lineRenderer: { style: 'beam', color: '#f43f5e', glowColor: '#e11d48', width: 5 },
        particles: [{ type: 'fire_sparks', color: '#f43f5e', count: 25 }],
        screenShake: { intensity: 'mild', durationMs: 200 },
      };
    }
    if (card.facingAttackType === 'aoe') {
      return {
        travelTimeMs: 350,
        windupTimeMs: 100,
        impactTimeMs: 300,
        lineRenderer: { style: 'shockwave_ring', color: '#f59e0b', glowColor: '#d97706', width: 6 },
        particles: [{ type: 'fire_sparks', color: '#f59e0b', count: 30 }],
        screenShake: { intensity: 'medium', durationMs: 250 },
        hasShockwaveRipple: true,
      };
    }
    return {
      travelTimeMs: 250,
      windupTimeMs: 50,
      impactTimeMs: 200,
      lineRenderer: { style: 'cleave_arc', color: '#f43f5e', glowColor: '#e11d48', width: 5 },
      particles: [{ type: 'blood_drops', color: '#e11d48', count: 20 }],
    };
  }

  if (card.category === 'movement') {
    return {
      travelTimeMs: 200,
      particles: [{ type: 'dust_debris', color: '#94a3b8', count: 5, spreadRadius: 10 }],
    };
  }

  if (card.category === 'defense') {
    return {
      travelTimeMs: 250,
      particles: [{ type: 'holy_glow', color: '#38bdf8', count: 25 }],
      colorFlash: { color: '#38bdf8', opacity: 0.15, durationMs: 200 },
    };
  }

  return {
    travelTimeMs: 300,
    windupTimeMs: 100,
    impactTimeMs: 200,
    particles: [{ type: 'holy_glow', color: '#fbbf24', count: 20 }],
  };
}
