import React, { useState, useMemo } from 'react';
import type { Card } from '../types/game';
import { STANDARD_DECK, DEFAULT_MOVE_CARDS } from '../utils/cardsData';
import { SafeImage } from './SafeImage';
import { 
  BookOpen, 
  Search, 
  X, 
  Sword, 
  Shield as ShieldIcon, 
  Sparkles, 
  Footprints, 
  Zap, 
  RotateCw, 
  Flame, 
  Hammer, 
  Wind, 
  ShieldAlert, 
  HeartPulse, 
  Info,
  Layers,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

interface CardCompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryFilter = 'all' | 'basic' | 'attack' | 'defense' | 'utility' | 'movement';

const BASIC_CARD_NAMES = new Set(DEFAULT_MOVE_CARDS.map(c => c.name));

const CATEGORY_CONFIG: Record<CategoryFilter, { label: string; icon: React.ReactNode; color: string; border: string; bg: string; badge: string }> = {
  all: {
    label: 'All Cards',
    icon: <Layers className="w-4 h-4" />,
    color: 'text-amber-400',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  basic: {
    label: 'Basic Actions',
    icon: <Compass className="w-4 h-4" />,
    color: 'text-emerald-400',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  attack: {
    label: 'Martial (Attack)',
    icon: <Sword className="w-4 h-4" />,
    color: 'text-rose-400',
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/10',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  defense: {
    label: 'Warding (Defense)',
    icon: <ShieldIcon className="w-4 h-4" />,
    color: 'text-sky-400',
    border: 'border-sky-500/50',
    bg: 'bg-sky-500/10',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  utility: {
    label: 'Sorcery (Utility)',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-amber-400',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  movement: {
    label: 'Agility (Movement)',
    icon: <Footprints className="w-4 h-4" />,
    color: 'text-emerald-400',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
};

function renderCardIcon(iconName: string, className: string = 'w-5 h-5') {
  switch (iconName) {
    case 'Footprints': return <Footprints className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Move': return <Footprints className={className} />;
    case 'Sword': return <Sword className={className} />;
    case 'Hammer': return <Hammer className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'RotateCw': return <RotateCw className={className} />;
    case 'Shield': return <ShieldIcon className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    default: return <Info className={className} />;
  }
}

function getFacingBadgeText(card: Omit<Card, 'id'> | Card): string | null {
  if (card.facingMoveType === 'forward') return ' Forward';
  if (card.facingMoveType === 'sprint') return ' Sprint';
  if (card.facingMoveType === 'sidestep_right' || card.facingMoveType === 'sidestep_left') return ' Strafe';
  if (card.facingMoveType === 'pivot_left') return ' Turn L';
  if (card.facingMoveType === 'pivot_right') return ' Turn R';
  if (card.facingMoveType === 'about_face') return ' 180 Flip';
  if (card.facingMoveType === 'backstep') return ' Retreat';
  if (card.facingAttackType === 'frontal') return ' Frontal';
  if (card.facingAttackType === 'line') return ' Line';
  if (card.facingAttackType === 'aoe') return ' 360 AOE';
  if (card.facingAttackType === 'cleave_arc') return ' 180 Arc';
  return null;
}

export const CardCompendiumModal: React.FC<CardCompendiumModalProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCard, setSelectedCard] = useState<Omit<Card, 'id'> | Card | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'range' | 'damage' | 'category'>('category');

  // Combine and deduplicate cards by name
  const allCards = useMemo(() => {
    const combined: Omit<Card, 'id'>[] = [...DEFAULT_MOVE_CARDS, ...STANDARD_DECK];
    const seen = new Set<string>();
    const unique: Omit<Card, 'id'>[] = [];

    for (const card of combined) {
      if (!seen.has(card.name)) {
        seen.add(card.name);
        unique.push(card);
      }
    }
    return unique;
  }, []);

  // Filter & sort cards
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const isBasic = BASIC_CARD_NAMES.has(card.name);

      // Category filter logic:
      // - 'basic': matches basic action cards
      // - 'all': matches everything
      // - 'attack' / 'defense' / 'utility' / 'movement': matches ONLY non-basic ability cards of that category!
      if (activeCategory === 'basic') {
        if (!isBasic) return false;
      } else if (activeCategory !== 'all') {
        if (isBasic || card.category !== activeCategory) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesDesc = card.description.toLowerCase().includes(query);
        const matchesCategory = card.category.toLowerCase().includes(query);
        const matchesType = card.type.toLowerCase().includes(query);
        const matchesBasic = isBasic && 'basic'.includes(query);

        return matchesName || matchesDesc || matchesCategory || matchesType || matchesBasic;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'range') return (b.range || 0) - (a.range || 0);
      if (sortBy === 'damage') return (b.damage || 0) - (a.damage || 0);
      if (sortBy === 'category') {
        const aCat = BASIC_CARD_NAMES.has(a.name) ? 'basic' : a.category;
        const bCat = BASIC_CARD_NAMES.has(b.name) ? 'basic' : b.category;
        return aCat.localeCompare(bCat);
      }
      return 0;
    });
  }, [allCards, activeCategory, searchQuery, sortBy]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: allCards.length,
      basic: 0,
      attack: 0,
      defense: 0,
      utility: 0,
      movement: 0,
    };
    allCards.forEach((c) => {
      if (BASIC_CARD_NAMES.has(c.name)) {
        counts.basic++;
      } else if (counts[c.category] !== undefined) {
        counts[c.category]++;
      }
    });
    return counts;
  }, [allCards]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[60px] bg-slate-950/85 backdrop-blur-md z-[150] flex flex-col items-center justify-start p-3 md:p-4 overflow-hidden">
      <div className="w-full max-w-6xl h-full fantasy-sharp-panel gold-corners-bottom border border-amber-500/50 rounded-none shadow-2xl flex flex-col overflow-hidden bg-slate-950/95 text-slate-200">
        
        {/* Header Bar */}
        <div className="p-4 md:p-6 border-b border-amber-500/30 flex items-center justify-between gap-4 bg-slate-900/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-amber-400 uppercase tracking-wide gold-gradient-text flex items-center gap-2 font-fantasy">
                Card Compendium
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Explore all {allCards.length} action & movement cards in Hex Clash
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-none bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 transition-all cursor-pointer"
            title="Close Compendium"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter, Search & Category Bar */}
        <div className="p-3 md:p-4 bg-slate-950 border-b border-slate-800 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between flex-shrink-0">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {(Object.keys(CATEGORY_CONFIG) as CategoryFilter[]).map((cat) => {
              const conf = CATEGORY_CONFIG[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-none text-xs font-bold font-mono transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? `${conf.bg} ${conf.color} border ${conf.border} shadow-md`
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {conf.icon}
                  <span>{conf.label}</span>
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-none bg-slate-950/80 border border-slate-800 text-slate-400 font-mono">
                    {categoryCounts[cat]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Sort Dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-none pl-9 pr-3 py-1.5 text-xs text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-none px-2 py-1 text-xs text-slate-400 font-mono">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="category" className="bg-slate-900 text-slate-200">Sort: Category</option>
                <option value="name" className="bg-slate-900 text-slate-200">Sort: Name</option>
                <option value="range" className="bg-slate-900 text-slate-200">Sort: Range</option>
                <option value="damage" className="bg-slate-900 text-slate-200">Sort: Damage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Body: Card Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/60 scrollbar-thin">
          {filteredCards.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
              <Search className="w-10 h-10 text-slate-600 animate-bounce" />
              <p className="text-sm font-bold font-mono">No matching cards found</p>
              <p className="text-xs text-slate-600">Try adjusting your search query or category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCards.map((card, idx) => {
                const isBasic = BASIC_CARD_NAMES.has(card.name);
                const conf = isBasic ? CATEGORY_CONFIG.basic : (CATEGORY_CONFIG[card.category] || CATEGORY_CONFIG.utility);
                const facingTag = getFacingBadgeText(card);

                return (
                  <div
                    key={`${card.name}-${idx}`}
                    onClick={() => setSelectedCard(card)}
                    className={`group relative p-4 rounded-none bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:${conf.border} hover:scale-[1.02] transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col justify-between space-y-3 overflow-hidden`}
                  >
                    {/* Top Glow Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-none ${conf.bg} border ${conf.border} ${conf.color} shadow-inner`}>
                          {card.iconName ? renderCardIcon(card.iconName, 'w-5 h-5') : renderCardIcon('Info', 'w-5 h-5')}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-100 group-hover:text-amber-300 transition-colors font-sans leading-tight">
                            {card.name}
                          </h3>
                          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-none ${conf.badge} inline-block mt-0.5`}>
                            {isBasic ? 'BASIC ACTION' : card.category.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Sprite/Icon Badge */}
                      {card.spriteUrl && (
                        <div className="w-8 h-8 rounded-none overflow-hidden border border-slate-800 bg-slate-950 flex-shrink-0">
                          <SafeImage src={card.spriteUrl} alt={card.name} className="w-full h-full object-contain p-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Card Description */}
                    <p className="text-xs text-slate-300 font-sans leading-relaxed flex-1">
                      {card.description}
                    </p>

                    {/* Card Badges / Key Stats */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                      {card.damage !== undefined && card.damage > 0 && (
                        <span className="px-2 py-0.5 rounded-none bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-bold">
                          <Sword className="w-3 h-3 text-rose-400" /> {card.damage} DMG
                        </span>
                      )}
                      {card.shield !== undefined && card.shield > 0 && (
                        <span className="px-2 py-0.5 rounded-none bg-sky-950/80 text-sky-300 border border-sky-500/40 flex items-center gap-1 font-bold">
                          <ShieldIcon className="w-3 h-3 text-sky-400" /> +{card.shield} Shield
                        </span>
                      )}
                      {card.healAmount !== undefined && card.healAmount > 0 && (
                        <span className="px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold">
                          <HeartPulse className="w-3 h-3 text-emerald-400" /> +{card.healAmount} HP
                        </span>
                      )}
                      {card.range !== undefined && (
                        <span className="px-2 py-0.5 rounded-none bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          Range: {card.range}
                        </span>
                      )}
                      {card.pushDist !== undefined && card.pushDist > 0 && (
                        <span className="px-2 py-0.5 rounded-none bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          Push {card.pushDist} Hex
                        </span>
                      )}
                      {card.pullDist !== undefined && card.pullDist > 0 && (
                        <span className="px-2 py-0.5 rounded-none bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                          Pull {card.pullDist} Hex
                        </span>
                      )}
                      {card.isUnyieldingSlot && (
                        <span className="px-2 py-0.5 rounded-none bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold flex items-center gap-1">
                          🛡️ Unyielding
                        </span>
                      )}
                      {facingTag && (
                        <span className="px-2 py-0.5 rounded-none bg-slate-900 text-slate-300 border border-slate-700">
                          {facingTag}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-center text-xs text-slate-400 font-mono flex items-center justify-between px-6 flex-shrink-0">
          <span>Hex Clash Card Index • Version 1.0</span>
          <span>Showing {filteredCards.length} of {allCards.length} Cards</span>
        </div>
      </div>

      {/* Selected Card Inspection Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="w-full max-w-md fantasy-sharp-panel gold-corners-bottom border-2 border-amber-500/80 rounded-none p-6 bg-slate-950 text-slate-200 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-none bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-md">
                  {selectedCard.iconName ? renderCardIcon(selectedCard.iconName, 'w-6 h-6') : renderCardIcon('Info', 'w-6 h-6')}
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-300 font-sans">{selectedCard.name}</h3>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{selectedCard.category} Card</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-1 rounded-none bg-slate-900 border border-slate-700 text-slate-400 hover:text-amber-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed bg-slate-900/70 p-3 rounded-none border border-slate-800">
              {selectedCard.description}
            </p>

            {/* Comprehensive Mechanic Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-none bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Category</span>
                <span className="font-bold text-amber-300 capitalize">{selectedCard.category}</span>
              </div>
              <div className="p-2.5 rounded-none bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Cast Range</span>
                <span className="font-bold text-amber-300">{selectedCard.range} Hexes</span>
              </div>
              {selectedCard.damage !== undefined && (
                <div className="p-2.5 rounded-none bg-rose-950/40 border border-rose-500/40">
                  <span className="text-rose-400 block text-[10px] uppercase">Damage</span>
                  <span className="font-bold text-rose-300">{selectedCard.damage} HP</span>
                </div>
              )}
              {selectedCard.shield !== undefined && (
                <div className="p-2.5 rounded-none bg-sky-950/40 border border-sky-500/40">
                  <span className="text-sky-400 block text-[10px] uppercase">Shield Granted</span>
                  <span className="font-bold text-sky-300">+{selectedCard.shield} Shield</span>
                </div>
              )}
              {selectedCard.healAmount !== undefined && (
                <div className="p-2.5 rounded-none bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-emerald-400 block text-[10px] uppercase">Health Restored</span>
                  <span className="font-bold text-emerald-300">+{selectedCard.healAmount} HP</span>
                </div>
              )}
              {selectedCard.pushDist !== undefined && (
                <div className="p-2.5 rounded-none bg-purple-950/40 border border-purple-500/40">
                  <span className="text-purple-400 block text-[10px] uppercase">Knockback Push</span>
                  <span className="font-bold text-purple-300">{selectedCard.pushDist} Hexes</span>
                </div>
              )}
              {selectedCard.pullDist !== undefined && (
                <div className="p-2.5 rounded-none bg-cyan-950/40 border border-cyan-500/40">
                  <span className="text-cyan-400 block text-[10px] uppercase">Vortex Pull</span>
                  <span className="font-bold text-cyan-300">{selectedCard.pullDist} Hexes</span>
                </div>
              )}
              {selectedCard.isUnyieldingSlot && (
                <div className="p-2.5 rounded-none bg-amber-500/20 border border-amber-500/50 col-span-2">
                  <span className="text-amber-300 font-bold block text-[10px] uppercase">Special Trait</span>
                  <span className="text-amber-200">Unyielding Stance (Slot Bump Immunity)</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCard(null)}
              className="w-full py-2.5 gold-btn font-extrabold rounded-none text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
