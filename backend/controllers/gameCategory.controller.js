const GameCategory = require('../models/GameCategory.model');
const Game = require('../models/Game.model');

// ── Seed defaults if table is empty ──────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { slug: 'trivia',      label: 'Movie Trivia',      description: 'Test your knowledge of cinema facts, directors, and awards.', icon: '🧠', color: 'linear-gradient(135deg, #6366f1, #4338ca)', order: 1 },
  { slug: 'guess_scene', label: 'Guess the Scene',   description: 'Identify movies from blurred screenshots or video clips.',    icon: '🎬', color: 'linear-gradient(135deg, #f97316, #ec4899)', order: 2 },
  { slug: 'dialogue',    label: 'Dialogue Challenge', description: 'Complete iconic movie dialogues and quotes.',                icon: '💬', color: 'linear-gradient(135deg, #10b981, #0d9488)', order: 3 },
  { slug: 'rapid_fire',  label: 'Rapid Fire',         description: 'Answer as many questions as you can before the timer runs out.', icon: '⚡', color: 'linear-gradient(135deg, #eab308, #f97316)', order: 4 },
];

const ensureDefaults = async () => {
  const count = await GameCategory.countDocuments();
  if (count === 0) {
    await GameCategory.insertMany(DEFAULT_CATEGORIES);
  }
};

// GET /api/game-categories  — public
exports.getCategories = async (req, res) => {
  try {
    await ensureDefaults();
    const cats = await GameCategory.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/game-categories/all  — admin (includes inactive)
exports.getAllCategories = async (req, res) => {
  try {
    await ensureDefaults();
    const cats = await GameCategory.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/game-categories/:slug/games  — public, returns games for one category
exports.getGamesByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const games = await Game.find({ type: slug, isActive: true }).select('-questions.correctAnswer');
    res.json({ success: true, data: games });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/game-categories  — admin create
exports.createCategory = async (req, res) => {
  try {
    const cat = await GameCategory.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/game-categories/:id  — admin update
exports.updateCategory = async (req, res) => {
  try {
    const cat = await GameCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/game-categories/:id  — admin delete
exports.deleteCategory = async (req, res) => {
  try {
    await GameCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
