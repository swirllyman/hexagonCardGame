import type { FactionId } from '../types/game';

export interface CharacterPortrait {
  id: string;
  name: string;
  title: string;
  faction: FactionId;
  avatarUrl: string;
}

export const CHARACTER_PORTRAITS: CharacterPortrait[] = [
  {
    id: 'valerius',
    name: 'Commander Valerius',
    title: 'Crimson Vanguard',
    faction: 'crimson',
    avatarUrl: 'sprites/portrait_valerius.svg',
  },
  {
    id: 'kaelen',
    name: 'Bot Kaelen',
    title: 'Azure Arcane Spellblade',
    faction: 'azure',
    avatarUrl: 'sprites/portrait_kaelen.svg',
  },
  {
    id: 'seraphina',
    name: 'Bot Seraphina',
    title: 'Emerald Leaf Guardian',
    faction: 'emerald',
    avatarUrl: 'sprites/portrait_seraphina.svg',
  },
  {
    id: 'ignis',
    name: 'Bot Ignis',
    title: 'Amber Flame Lord',
    faction: 'amber',
    avatarUrl: 'sprites/portrait_ignis.svg',
  },
  {
    id: 'shadow',
    name: 'Void Shadow',
    title: 'Shadow Assassin',
    faction: 'crimson',
    avatarUrl: 'sprites/portrait_shadow.svg',
  },
  {
    id: 'titan',
    name: 'Iron Titan',
    title: 'Mech Juggernaut',
    faction: 'amber',
    avatarUrl: 'sprites/portrait_titan.svg',
  },
  {
    id: 'frost',
    name: 'Frost Warden',
    title: 'Ice Templar',
    faction: 'azure',
    avatarUrl: 'sprites/portrait_frost.svg',
  },
  {
    id: 'storm',
    name: 'Storm Weaver',
    title: 'Lightning Specialist',
    faction: 'emerald',
    avatarUrl: 'sprites/portrait_storm.svg',
  },
];
