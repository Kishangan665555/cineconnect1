import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  apiGetGames, apiGetLeaderboard, apiGetStoreItems, apiBuyStoreItem,
  apiGetGameCategories,
} from '../services/apiService';
import MovieTrivia from '../components/games/MovieTrivia';
import GuessTheScene from '../components/games/GuessTheScene';
import DialogueChallenge from '../components/games/DialogueChallenge';

interface GameModel {
  _id: string; title: string; type: string; difficulty: string;
  timeLimit: number; rewardPoints: number; thumbnail: string;
  questions: any[]; blurIntensity?: number;
}
interface Category {
  _id: string; slug: string; label: string; description: string;
  icon: string; color: string; order: number;
}

const DIFF_COLOR: Record<string, string> = {
  easy:   'rgba(16,185,129,0.85)',
  medium: 'rgba(251,146,60,0.85)',
  hard:   'rgba(239,68,68,0.85)',
};
const DIFF_BG: Record<string, string> = {
  easy:   'rgba(16,185,129,0.12)',
  medium: 'rgba(251,146,60,0.12)',
  hard:   'rgba(239,68,68,0.12)',
};

/* ── Small reusable GameCard ─────────────────────────────────────────────── */
function GameCard({ game, onPlay }: { game: GameModel; onPlay: () => void }) {
  return (
    <div
      onClick={onPlay}
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        overflow: 'hidden',
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
        height: 130, position: 'relative',
        background: game.thumbnail
          ? `url(${game.thumbnail}) center/cover no-repeat`
          : 'linear-gradient(135deg, rgba(236,72,153,0.18),rgba(251,146,60,0.18))',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65))' }} />
        <span style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          padding: '3px 9px', borderRadius: 10, fontSize: 10,
          fontWeight: 800, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.8px',
        }}>
          {game.type.replace('_', ' ')}
        </span>
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: DIFF_BG[game.difficulty] || 'rgba(255,255,255,0.1)',
          color: DIFF_COLOR[game.difficulty] || 'white',
          padding: '3px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        }}>
          {game.difficulty}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 6, lineHeight: 1.3 }}>{game.title}</h4>
        <div style={{ display: 'flex', gap: 14, marginTop: 'auto', paddingTop: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600 }}>⏱ {game.timeLimit}s</span>
          <span style={{ color: '#ec4899', fontSize: 12, fontWeight: 800 }}>💎 {game.rewardPoints} pts</span>
        </div>
        <button
          style={{
            marginTop: 12, padding: '10px', width: '100%',
            background: 'linear-gradient(135deg, #f97316, #ec4899)',
            border: 'none', borderRadius: 10,
            color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Play Now
        </button>
      </div>
    </div>
  );
}

/* ── Main PlayZone Component ─────────────────────────────────────────────── */
export default function PlayZone() {
  const { navigate, currentUser } = useApp();
  const [games, setGames]         = useState<GameModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [activeGame, setActiveGame] = useState<GameModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [gamesRes, catsRes, boardRes, storeRes] = await Promise.all([
      apiGetGames(),
      apiGetGameCategories(),
      apiGetLeaderboard(),
      apiGetStoreItems(),
    ]);
    if (gamesRes.ok && gamesRes.data?.data) setGames(gamesRes.data.data);
    if (catsRes.ok  && catsRes.data?.data)  setCategories(catsRes.data.data);
    if (boardRes.ok && boardRes.data?.data) setLeaderboard(boardRes.data.data);
    if (storeRes.ok && storeRes.data?.data) setStoreItems(storeRes.data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser) { navigate('auth'); return; }
    fetchData();
  }, [currentUser, navigate, fetchData]);

  const handleBuy = async (item: any) => {
    if (!currentUser) return;
    if ((currentUser as any).totalScore < item.pointCost) { alert('Not enough points!'); return; }
    if (!window.confirm(`Buy ${item.title} for ${item.pointCost} points?`)) return;
    setBuying(item._id);
    const res = await apiBuyStoreItem(item._id);
    setBuying(null);
    if (res.ok) { alert(`Unlocked: ${res.data?.reward?.code || item.title}`); window.location.reload(); }
    else alert(res.message || 'Purchase failed.');
  };

  // ── Active game renderer ──────────────────────────────────────────────────
  if (activeGame) {
    const onBack = () => { setActiveGame(null); fetchData(); };
    if (activeGame.type === 'trivia')      return <MovieTrivia      game={activeGame} onBack={onBack} />;
    if (activeGame.type === 'guess_scene') return <GuessTheScene    game={activeGame} onBack={onBack} />;
    if (activeGame.type === 'dialogue')    return <DialogueChallenge game={activeGame} onBack={onBack} />;
    return (
      <div style={{ minHeight: '100vh', background: '#0a0014', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h2>{activeGame.title} – Coming Soon</h2>
        <button onClick={onBack} style={{ marginTop: 20, padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, cursor: 'pointer' }}>Back</button>
      </div>
    );
  }

  // ── Build category sections ───────────────────────────────────────────────
  const FEATURED = 5; // games shown per category row before "View All"

  const categorySections = categories.map(cat => ({
    cat,
    games: games.filter(g => g.type === cat.slug),
  })).filter(s => s.games.length > 0);

  // Uncategorised games (type not in any active category)
  const categorisedSlugs = new Set(categories.map(c => c.slug));
  const otherGames = games.filter(g => !categorisedSlugs.has(g.type));

  return (
    <div style={{ minHeight: '100vh', background: '#07071a', paddingTop: 88, paddingBottom: 80, fontFamily: "'Outfit', sans-serif" }}>

      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 15% 25%, rgba(236,72,153,0.07) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(251,146,60,0.07) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)'
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '0 28px' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 48 }}>
          <div>
            <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, margin: 0 }}>
              <span style={{ background: 'linear-gradient(135deg, #f97316, #ec4899, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Play Zone
              </span>{' '}🎮
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 10, maxWidth: 480 }}>
              Play movie games, unlock real discount coupons, and climb the global leaderboard!
            </p>
          </div>

          {currentUser && (
            <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
              {[
                { label: 'Your Score', value: `${(currentUser as any).totalScore || 0}`, unit: 'PTS', color: '#fb923c' },
                { label: 'Streak',     value: `🔥 ${(currentUser as any).playStreak || 0}`, unit: 'days', color: '#ec4899' },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '14px 24px', borderRight: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, marginTop: 2 }}>
                    {stat.value} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Category Hero Chips ─────────────────────────────────────────── */}
        {!loading && categories.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 52 }}>
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => navigate('play-zone-category', { categorySlug: cat.slug })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 40, cursor: 'pointer',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget; el.style.background = cat.color;
                  el.style.borderColor = 'transparent'; el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.04)';
                  el.style.borderColor = 'rgba(255,255,255,0.09)'; el.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Main two-column layout ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 36, alignItems: 'start' }}>

          {/* Left: Category Sections */}
          <div>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                <p>Loading games...</p>
              </div>
            ) : categorySections.length === 0 && otherGames.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎮</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No games yet. Ask an admin to add some!</p>
              </div>
            ) : (
              <>
                {categorySections.map(({ cat, games: catGames }) => (
                  <section key={cat._id} style={{ marginBottom: 52 }}>

                    {/* Section Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Gradient left bar */}
                        <div style={{ width: 4, height: 28, borderRadius: 4, background: cat.color }} />
                        <span style={{ fontSize: 28 }}>{cat.icon}</span>
                        <div>
                          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0, lineHeight: 1 }}>{cat.label}</h2>
                          {cat.description && (
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 500 }}>{cat.description}</p>
                          )}
                        </div>
                      </div>

                      {catGames.length > FEATURED && (
                        <button
                          onClick={() => navigate('play-zone-category', { categorySlug: cat.slug })}
                          style={{
                            padding: '8px 18px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 40, cursor: 'pointer',
                            color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 700,
                            transition: 'all 0.2s', whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = cat.color; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                          View All ({catGames.length}) →
                        </button>
                      )}
                    </div>

                    {/* Game Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>
                      {catGames.slice(0, FEATURED).map(game => (
                        <GameCard key={game._id} game={game} onPlay={() => setActiveGame(game)} />
                      ))}

                      {/* "View All" filler card if there are more */}
                      {catGames.length > FEATURED && (
                        <div
                          onClick={() => navigate('play-zone-category', { categorySlug: cat.slug })}
                          style={{
                            borderRadius: 20, border: '1px dashed rgba(255,255,255,0.12)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 10, cursor: 'pointer', minHeight: 220,
                            background: 'rgba(255,255,255,0.02)',
                            transition: 'background 0.2s, border-color 0.2s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.25)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
                        >
                          <span style={{ fontSize: 32 }}>+{catGames.length - FEATURED}</span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>more games</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>View All →</span>
                        </div>
                      )}
                    </div>
                  </section>
                ))}

                {/* Uncategorised */}
                {otherGames.length > 0 && (
                  <section style={{ marginBottom: 52 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                      <div style={{ width: 4, height: 28, borderRadius: 4, background: 'linear-gradient(#6366f1,#a855f7)' }} />
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0 }}>🎲 Other Games</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>
                      {otherGames.map(game => (
                        <GameCard key={game._id} game={game} onPlay={() => setActiveGame(game)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* ── Rewards Store ─────────────────────────────────────── */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                    <div style={{ width: 4, height: 28, borderRadius: 4, background: 'linear-gradient(#10b981,#059669)' }} />
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0 }}>🏆 Rewards Store</h2>
                  </div>
                  {storeItems.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Store is currently empty.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {storeItems.map(item => (
                        <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ width: 52, height: 52, background: 'rgba(16,185,129,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                            {item.rewardType === 'coupon' ? '🎟️' : '🏅'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>{item.title}</h4>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>{item.description}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                            <span style={{ fontWeight: 900, color: '#fb923c', fontSize: 18 }}>{item.pointCost} PTS</span>
                            <button
                              disabled={buying === item._id || ((currentUser as any)?.totalScore || 0) < item.pointCost}
                              onClick={() => handleBuy(item)}
                              style={{
                                padding: '9px 20px',
                                background: ((currentUser as any)?.totalScore || 0) >= item.pointCost ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)',
                                color: 'white', border: 'none', borderRadius: 10,
                                fontWeight: 800, fontSize: 13,
                                cursor: ((currentUser as any)?.totalScore || 0) >= item.pointCost ? 'pointer' : 'not-allowed',
                                opacity: buying === item._id ? 0.6 : 1,
                                transition: 'opacity 0.2s',
                              }}
                            >
                              {buying === item._id ? '…' : 'Buy'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Right: Leaderboard + Tips */}
          <div style={{ position: 'sticky', top: 92 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>🏆 Global Leaders</h3>
                <span style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899', padding: '3px 9px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>LIVE</span>
              </div>
              {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>Loading…</p>
              ) : leaderboard.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '16px 0', fontSize: 13 }}>No scores yet. Be the first!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {leaderboard.slice(0, 10).map((entry, i) => {
                    const isMe = currentUser && entry._id === (currentUser as any)._id;
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                    return (
                      <div key={entry._id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 14,
                        background: isMe ? 'rgba(236,72,153,0.08)' : 'rgba(0,0,0,0.2)',
                        border: isMe ? '1px solid rgba(236,72,153,0.25)' : '1px solid transparent',
                      }}>
                        <div style={{ fontSize: i < 3 ? 18 : 12, fontWeight: 800, color: i < 3 ? undefined : 'rgba(255,255,255,0.4)', minWidth: 28, textAlign: 'center' }}>{medal}</div>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: entry.avatar ? `url(${entry.avatar}) center/cover` : '#2d2d50', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entry.name || entry.username || 'Player'}
                          </div>
                          {isMe && <div style={{ fontSize: 9, color: '#ec4899', fontWeight: 800 }}>YOU</div>}
                        </div>
                        <div style={{ fontWeight: 800, color: '#fb923c', fontSize: 14 }}>{entry.totalScore?.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auto-reward tip */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.08))', padding: 20, borderRadius: 20, border: '1px solid rgba(16,185,129,0.18)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>🎁</span>
                <h4 style={{ color: '#10b981', fontWeight: 800, fontSize: 14, margin: 0 }}>Automatic Rewards</h4>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                Score <strong style={{ color: 'white' }}>200+ points</strong> in any game for a <strong style={{ color: 'white' }}>30% chance</strong> to win a 15% discount coupon instantly. Play daily to multiply your streak bonus!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
