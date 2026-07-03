// Play Zone — Category View (all games in a specific category)
import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetGamesByCategory, apiGetGameCategories } from '../services/apiService';
import MovieTrivia       from '../components/games/MovieTrivia';
import GuessTheScene     from '../components/games/GuessTheScene';
import DialogueChallenge from '../components/games/DialogueChallenge';

interface GameModel {
  _id: string; title: string; type: string; difficulty: string;
  timeLimit: number; rewardPoints: number; thumbnail: string;
  questions: any[]; blurIntensity?: number;
}
interface Category {
  _id: string; slug: string; label: string; description: string;
  icon: string; color: string;
}

const DIFF_COLOR: Record<string, string> = {
  easy: 'rgba(16,185,129,0.9)', medium: 'rgba(251,146,60,0.9)', hard: 'rgba(239,68,68,0.9)',
};
const DIFF_BG: Record<string, string> = {
  easy: 'rgba(16,185,129,0.12)', medium: 'rgba(251,146,60,0.12)', hard: 'rgba(239,68,68,0.12)',
};

type SortKey = 'default' | 'difficulty_asc' | 'difficulty_desc' | 'points_desc' | 'points_asc';
const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };

function sortGames(games: GameModel[], key: SortKey): GameModel[] {
  const arr = [...games];
  switch (key) {
    case 'difficulty_asc':  return arr.sort((a, b) => (DIFFICULTY_ORDER[a.difficulty as keyof typeof DIFFICULTY_ORDER] ?? 1) - (DIFFICULTY_ORDER[b.difficulty as keyof typeof DIFFICULTY_ORDER] ?? 1));
    case 'difficulty_desc': return arr.sort((a, b) => (DIFFICULTY_ORDER[b.difficulty as keyof typeof DIFFICULTY_ORDER] ?? 1) - (DIFFICULTY_ORDER[a.difficulty as keyof typeof DIFFICULTY_ORDER] ?? 1));
    case 'points_desc':     return arr.sort((a, b) => b.rewardPoints - a.rewardPoints);
    case 'points_asc':      return arr.sort((a, b) => a.rewardPoints - b.rewardPoints);
    default:                return arr;
  }
}

export default function PlayZoneCategoryPage() {
  const { navigate, activeCategorySlug, currentUser } = useApp();
  const [games, setGames]       = useState<GameModel[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeGame, setActiveGame] = useState<GameModel | null>(null);
  const [sort, setSort]         = useState<SortKey>('default');
  const [filter, setFilter]     = useState<string>('all'); // difficulty filter
  const [search, setSearch]     = useState('');

  const fetchData = useCallback(async () => {
    if (!activeCategorySlug) return;
    setLoading(true);
    const [gamesRes, catsRes] = await Promise.all([
      apiGetGamesByCategory(activeCategorySlug),
      apiGetGameCategories(),
    ]);
    if (gamesRes.ok && gamesRes.data?.data) setGames(gamesRes.data.data);
    if (catsRes.ok  && catsRes.data?.data) {
      const found = catsRes.data.data.find((c: Category) => c.slug === activeCategorySlug);
      if (found) setCategory(found);
    }
    setLoading(false);
  }, [activeCategorySlug]);

  useEffect(() => {
    if (!currentUser) { navigate('auth'); return; }
    if (!activeCategorySlug) { navigate('play-zone'); return; }
    fetchData();
  }, [currentUser, activeCategorySlug, navigate, fetchData]);

  /* Active game renderer */
  if (activeGame) {
    const onBack = () => { setActiveGame(null); fetchData(); };
    if (activeGame.type === 'trivia')      return <MovieTrivia      game={activeGame} onBack={onBack} />;
    if (activeGame.type === 'guess_scene') return <GuessTheScene    game={activeGame} onBack={onBack} />;
    if (activeGame.type === 'dialogue')    return <DialogueChallenge game={activeGame} onBack={onBack} />;
    return (
      <div style={{ minHeight: '100vh', background: '#07071a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>
        <h2 style={{ marginBottom: 16 }}>{activeGame.title} – Coming Soon</h2>
        <button onClick={onBack} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>← Back</button>
      </div>
    );
  }

  /* Derived filtered + sorted list */
  const processed = sortGames(
    games.filter(g => {
      const matchesDiff   = filter === 'all' || g.difficulty === filter;
      const matchesSearch = !search || g.title.toLowerCase().includes(search.toLowerCase());
      return matchesDiff && matchesSearch;
    }),
    sort
  );

  const accent = category?.color || 'linear-gradient(135deg,#f97316,#ec4899)';

  return (
    <div style={{ minHeight: '100vh', background: '#07071a', paddingTop: 88, paddingBottom: 80, fontFamily: "'Outfit', sans-serif" }}>

      {/* Glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 20% 20%, rgba(236,72,153,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.06) 0%, transparent 50%)'
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '0 28px' }}>

        {/* ── Back + breadcrumb ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <button
            onClick={() => navigate('play-zone')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '8px 16px',
              cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            ← Play Zone
          </button>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>/</span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 600 }}>
            {category ? `${category.icon} ${category.label}` : activeCategorySlug}
          </span>
        </div>

        {/* ── Category Hero ─────────────────────────────────────────────── */}
        <div style={{
          marginBottom: 48, padding: '36px 40px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 28, position: 'relative', overflow: 'hidden',
        }}>
          {/* Gradient accent bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />

          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  {category?.icon || '🎮'}
                </div>
                <div>
                  <h1 style={{ fontSize: 34, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
                    {category?.label || activeCategorySlug}
                  </h1>
                  {category?.description && (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6, maxWidth: 480 }}>{category.description}</p>
                  )}
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '12px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>{games.length}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Games</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Filters + Sort Bar ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          marginBottom: 32, padding: '16px 20px',
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18,
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search games…"
              style={{
                width: '100%', padding: '9px 12px 9px 34px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, color: 'white', fontSize: 13, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          {/* Difficulty filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                style={{
                  padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${filter === d ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  background: filter === d
                    ? (d === 'all' ? accent : DIFF_BG[d])
                    : 'rgba(255,255,255,0.04)',
                  color: filter === d
                    ? (d === 'all' ? 'white' : DIFF_COLOR[d])
                    : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            style={{
              padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              color: 'white', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="default">Sort: Default</option>
            <option value="difficulty_asc">Easiest First</option>
            <option value="difficulty_desc">Hardest First</option>
            <option value="points_desc">Most Points</option>
            <option value="points_asc">Fewest Points</option>
          </select>

          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            {processed.length} game{processed.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Games Grid ────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p>Loading games…</p>
          </div>
        ) : processed.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎮</div>
            <h3 style={{ color: 'white', fontWeight: 800, marginBottom: 8 }}>No games found</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Try adjusting your filters or search term.</p>
            <button
              onClick={() => { setFilter('all'); setSearch(''); setSort('default'); }}
              style={{ marginTop: 20, padding: '10px 24px', background: accent, border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22 }}>
            {processed.map(game => (
              <div
                key={game._id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 22, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
                  display: 'flex', flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(-6px)';
                  el.style.borderColor = 'rgba(236,72,153,0.35)';
                  el.style.boxShadow = '0 20px 48px rgba(0,0,0,0.55), 0 0 24px rgba(236,72,153,0.12)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(0)';
                  el.style.borderColor = 'rgba(255,255,255,0.07)';
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 145, position: 'relative',
                  background: game.thumbnail
                    ? `url(${game.thumbnail}) center/cover no-repeat`
                    : accent.includes('gradient') ? accent : `linear-gradient(135deg, rgba(236,72,153,0.18),rgba(251,146,60,0.18))`,
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
                  <span style={{
                    position: 'absolute', top: 10, right: 10,
                    background: DIFF_BG[game.difficulty] || 'rgba(255,255,255,0.1)',
                    color: DIFF_COLOR[game.difficulty] || 'white',
                    padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  }}>
                    {game.difficulty}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 6, lineHeight: 1.3 }}>{game.title}</h3>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 10, display: 'flex', gap: 12 }}>
                    <span>⏱ {game.timeLimit}s</span>
                    <span>{game.questions?.length || 0} questions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10 }}>
                    <span style={{ color: '#ec4899', fontSize: 14, fontWeight: 900 }}>💎 {game.rewardPoints} pts</span>
                  </div>
                  <button
                    onClick={() => setActiveGame(game)}
                    style={{
                      marginTop: 14, padding: '11px', width: '100%',
                      background: 'linear-gradient(135deg, #f97316, #ec4899)',
                      border: 'none', borderRadius: 12,
                      color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Play Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
