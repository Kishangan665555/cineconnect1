import React, { useState, useEffect } from 'react';
import {
  apiGetGames, apiCreateGame, apiUpdateGame, apiDeleteGame, apiUploadGameMedia, apiGetAdminLeaderboard,
  apiGetAllGameCategories, apiCreateGameCategory, apiUpdateGameCategory, apiDeleteGameCategory,
} from '../../services/apiService';

export default function AdminGameManager() {
  const [games, setGames] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'games' | 'leaderboard' | 'categories'>('games');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Category Form State
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catSlug, setCatSlug] = useState('');
  const [catLabel, setCatLabel] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('🎮');
  const [catColor, setCatColor] = useState('linear-gradient(135deg, #6366f1, #a855f7)');
  const [catOrder, setCatOrder] = useState(0);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('trivia');
  const [difficulty, setDifficulty] = useState('medium');
  const [timeLimit, setTimeLimit] = useState(30);
  const [rewardPoints, setRewardPoints] = useState(100);
  const [thumbnail, setThumbnail] = useState('');
  const [blurIntensity, setBlurIntensity] = useState(4);
  const [questions, setQuestions] = useState<any[]>([]);

  const fetchGamesAndLeaderboard = async () => {
    setLoading(true);
    const [resGames, resBoard, resCats] = await Promise.all([
      apiGetGames(),
      apiGetAdminLeaderboard(),
      apiGetAllGameCategories(),
    ]);
    if (resGames.ok && resGames.data && resGames.data.data) setGames(resGames.data.data);
    if (resBoard.ok && resBoard.data && resBoard.data.data) setLeaderboard(resBoard.data.data);
    if (resCats.ok  && resCats.data  && resCats.data.data)  setCategories(resCats.data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGamesAndLeaderboard();
  }, []);

  const handleOpenForm = (game: any = null) => {
    if (game) {
      setEditingId(game._id);
      setTitle(game.title);
      setType(game.type);
      setDifficulty(game.difficulty);
      setTimeLimit(game.timeLimit);
      setRewardPoints(game.rewardPoints);
      setThumbnail(game.thumbnail || '');
      setBlurIntensity(game.blurIntensity ?? 4);
      setQuestions(game.questions || []);
    } else {
      setEditingId(null);
      setTitle('');
      setType('trivia');
      setDifficulty('medium');
      setTimeLimit(30);
      setRewardPoints(100);
      setThumbnail('');
      setBlurIntensity(4);
      setQuestions([]);
    }
    setIsFormOpen(true);
  };

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleMediaUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingIdx(index);
    const res = await apiUploadGameMedia(file);
    if (res.ok && res.data?.url) {
      handleQuestionChange(index, 'questionText', res.data.url);
    } else {
      alert('Upload failed');
    }
    setUploadingIdx(null);
  };

  const removeQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleSave = async () => {
    const payload = { title, type, difficulty, timeLimit, rewardPoints, thumbnail, blurIntensity, questions };
    let res;
    if (editingId) {
      res = await apiUpdateGame(editingId, payload);
    } else {
      res = await apiCreateGame(payload);
    }
    
    if (!res.ok) {
      alert('Failed to save game: ' + res.message);
      return; // Do not close form or fetch games if saving failed
    }

    setIsFormOpen(false);
    fetchGamesAndLeaderboard();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      await apiDeleteGame(id);
      fetchGamesAndLeaderboard();
    }
  };

  // ── Category Handlers ────────────────────────────────────────────────────
  const openCatForm = (cat: any = null) => {
    if (cat) {
      setCatEditId(cat._id); setCatSlug(cat.slug);   setCatLabel(cat.label);
      setCatDesc(cat.description || '');   setCatIcon(cat.icon || '🎮');
      setCatColor(cat.color || 'linear-gradient(135deg,#6366f1,#a855f7)');
      setCatOrder(cat.order ?? 0);
    } else {
      setCatEditId(null); setCatSlug(''); setCatLabel(''); setCatDesc('');
      setCatIcon('🎮'); setCatColor('linear-gradient(135deg,#6366f1,#a855f7)'); setCatOrder(0);
    }
    setCatFormOpen(true);
  };

  const saveCat = async () => {
    const payload = { slug: catSlug, label: catLabel, description: catDesc, icon: catIcon, color: catColor, order: catOrder };
    const res = catEditId ? await apiUpdateGameCategory(catEditId, payload) : await apiCreateGameCategory(payload);
    if (!res.ok) { alert('Failed: ' + (res as any).message); return; }
    setCatFormOpen(false);
    fetchGamesAndLeaderboard();
  };

  const deleteCat = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    await apiDeleteGameCategory(id);
    fetchGamesAndLeaderboard();
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['games', 'categories', 'leaderboard'] as const).map(tab => (
            <button key={tab} onClick={() => setViewMode(tab)} style={{
              padding: '8px 16px',
              background: viewMode === tab ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
              color: viewMode === tab ? 'white' : 'rgba(255,255,255,0.6)',
              fontWeight: 700, cursor: 'pointer', fontSize: 13,
              transition: 'all 0.2s',
            }}>
              {tab === 'games' ? '🎮 Manage Games' : tab === 'categories' ? '🗂 Categories' : '🏆 Leaderboard'}
            </button>
          ))}
        </div>
        {viewMode === 'games' && (
          <button onClick={() => handleOpenForm()} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, cursor: 'pointer' }}>
            + Create New Game
          </button>
        )}
        {viewMode === 'categories' && (
          <button onClick={() => openCatForm()} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, cursor: 'pointer' }}>
            + Add Category
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>

      ) : viewMode === 'categories' ? (
        <div>
          {/* Category inline form */}
          {catFormOpen && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#a5b4fc' }}>{catEditId ? 'Edit Category' : 'New Category'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Slug (matches game type)</label>
                  <input value={catSlug} onChange={e => setCatSlug(e.target.value)} placeholder="e.g. trivia" style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Display Label</label>
                  <input value={catLabel} onChange={e => setCatLabel(e.target.value)} placeholder="Movie Trivia" style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Icon</label>
                  <input value={catIcon} onChange={e => setCatIcon(e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', boxSizing: 'border-box', textAlign: 'center', fontSize: 20 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Order</label>
                  <input type="number" value={catOrder} onChange={e => setCatOrder(Number(e.target.value))} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Description</label>
                <input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Short description shown under the category title" style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Accent Color (CSS gradient or hex)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input value={catColor} onChange={e => setCatColor(e.target.value)} placeholder="linear-gradient(135deg, #6366f1, #a855f7)" style={{ flex: 1, padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontFamily: 'monospace', fontSize: 12 }} />
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: catColor, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                </div>
                {/* Quick presets */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {[
                    'linear-gradient(135deg,#6366f1,#4338ca)',
                    'linear-gradient(135deg,#f97316,#ec4899)',
                    'linear-gradient(135deg,#10b981,#0d9488)',
                    'linear-gradient(135deg,#eab308,#f97316)',
                    'linear-gradient(135deg,#a855f7,#ec4899)',
                    'linear-gradient(135deg,#0ea5e9,#6366f1)',
                  ].map(g => (
                    <div key={g} onClick={() => setCatColor(g)} style={{ width: 28, height: 28, borderRadius: 6, background: g, cursor: 'pointer', border: catColor === g ? '2px solid white' : '1px solid rgba(255,255,255,0.2)' }} title={g} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setCatFormOpen(false)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                <button onClick={saveCat} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontWeight: 800 }}>Save Category</button>
              </div>
            </div>
          )}

          {/* Category list */}
          {categories.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>No categories yet. Click "Add Category" to create one.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categories.map(cat => (
                <div key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(0,0,0,0.35)', padding: '14px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: 2 }}>slug: {cat.slug} — order: {cat.order}</div>
                    {cat.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{cat.description}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>
                    {games.filter(g => g.type === cat.slug).length} games
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openCatForm(cat)} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Edit</button>
                    <button onClick={() => deleteCat(cat._id)} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      ) : viewMode === 'leaderboard' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leaderboard.map((user, idx) => (
            <div key={user._id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 200px 100px', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: idx < 3 ? '#fb923c' : 'white' }}>#{idx + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>@{user.username}</div>
              </div>
              <div style={{ color: '#10b981', fontFamily: 'monospace' }}>{user.email}</div>
              <div style={{ fontWeight: 900, color: '#ec4899', textAlign: 'right' }}>{user.totalScore} Pts</div>
            </div>
          ))}
          {leaderboard.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>No player scores found.</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {games.map(game => (
            <div key={game._id} style={{ background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fb923c' }}>{game.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Type: {game.type} | Difficulty: {game.difficulty} | {game.rewardPoints} Points</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{game.questions?.length || 0} Questions</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleOpenForm(game)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button onClick={() => handleDelete(game._id)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#111', padding: 32, borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 24, marginBottom: 24 }}>{editingId ? 'Edit Game' : 'Create Game'}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'rgba(255,255,255,0.6)' }}>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'rgba(255,255,255,0.6)' }}>Type</label>
                <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}>
                  <option value="trivia">Trivia</option>
                  <option value="guess_scene">Guess the Scene</option>
                  <option value="dialogue">Dialogue Challenge</option>
                  <option value="rapid_fire">Rapid Fire</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'rgba(255,255,255,0.6)' }}>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'rgba(255,255,255,0.6)' }}>Time Limit (sec)</label>
                <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'rgba(255,255,255,0.6)' }}>Reward Points</label>
                <input type="number" value={rewardPoints} onChange={e => setRewardPoints(Number(e.target.value))} style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 8, color: 'rgba(255,255,255,0.6)' }}>Thumbnail URL</label>
                <input value={thumbnail} onChange={e => setThumbnail(e.target.value)} style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
              </div>
            </div>

            {/* ── Blur Intensity (Guess the Scene only) ─────────────────────── */}
            {type === 'guess_scene' && (
              <div style={{ marginBottom: 24, padding: 20, background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fb923c' }}>🎭 Scene Blur Intensity</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Controls how blurry the image / video appears to players at the start</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fb923c', minWidth: 60, textAlign: 'right' }}>
                    {blurIntensity}px
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={blurIntensity}
                  onChange={e => setBlurIntensity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fb923c', cursor: 'pointer', height: 6 }}
                />

                {/* Tick labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  <span>0 – None</span>
                  <span>5 – Light</span>
                  <span>10 – Medium</span>
                  <span>15 – Strong</span>
                  <span>20 – Heavy</span>
                </div>

                {/* Live preview strip */}
                <div style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden', height: 60, background: 'linear-gradient(135deg, #1a0a2e, #2d0a47, #0a1a3e)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: 22, filter: `blur(${blurIntensity}px)`, transition: 'filter 0.3s', userSelect: 'none' }}>🎬 Movie Scene Preview</span>
                  <span style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Live preview</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 24, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18 }}>Questions</h3>
                <button onClick={addQuestion} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: 12 }}>+ Add Question</button>
              </div>

              {questions.map((q, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: '#ec4899' }}>Question {idx + 1}</div>
                    <button onClick={() => removeQuestion(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                  </div>
                  {type === 'guess_scene' ? (
                    <div style={{ marginBottom: 12 }}>
                      {q.questionText ? (
                        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 12, color: '#10b981' }}>✓ Media Uploaded</span>
                          <button onClick={() => handleQuestionChange(idx, 'questionText', '')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>Clear</button>
                        </div>
                      ) : (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                          <label style={{ display: 'block', cursor: 'pointer' }}>
                            <span style={{ color: '#fb923c', fontWeight: 600 }}>{uploadingIdx === idx ? 'Uploading...' : 'Click to Upload Video / Image'}</span>
                            <input type="file" accept="image/*,video/*" onChange={e => handleMediaUpload(idx, e)} style={{ display: 'none' }} disabled={uploadingIdx === idx} />
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input placeholder="Question Text" value={q.questionText} onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', marginBottom: 12 }} />
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {q.options.map((opt: string, oIdx: number) => (
                      <input key={oIdx} placeholder={`Option ${oIdx + 1}`} value={opt} onChange={e => handleOptionChange(idx, oIdx, e.target.value)} style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white', fontSize: 12 }} />
                    ))}
                  </div>
                  
                  <input placeholder="Correct Answer (Must match exactly one option)" value={q.correctAnswer} onChange={e => handleQuestionChange(idx, 'correctAnswer', e.target.value)} style={{ width: '100%', padding: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', fontWeight: 600 }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setIsFormOpen(false)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: '12px 24px', background: '#fb923c', border: 'none', borderRadius: 8, color: 'black', fontWeight: 800, cursor: 'pointer' }}>Save Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
