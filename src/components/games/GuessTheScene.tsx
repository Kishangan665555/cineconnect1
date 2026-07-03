import { useState, useEffect } from 'react';
import { apiSubmitGameScore } from '../../services/apiService';

interface Props {
  game: any;
  onBack: () => void;
}

export default function GuessTheScene({ game, onBack }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(game.timeLimit || 30);
  const [gameStartTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, currentIdx, answers]);

  const currentQ = game.questions[currentIdx];

  const handleSelect = (opt: string) => {
    if (isFinished) return;
    setSelectedOpt(opt);
    
    setTimeout(() => {
      const newAnswers = [...answers, opt];
      setAnswers(newAnswers);
      setSelectedOpt(null);

      if (currentIdx + 1 < game.questions.length) {
        setCurrentIdx(currentIdx + 1);
      } else {
        handleFinish(newAnswers);
      }
    }, 600);
  };

  const handleFinish = async (finalAnswers = answers) => {
    setIsFinished(true);
    setSubmitting(true);
    
    const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
    const res = await apiSubmitGameScore(game._id, {
      score: 0,
      timeSpent,
      answers: finalAnswers
    });

    if (res.ok) {
      setResult(res.data?.data || res.data);
    } else {
      setResult({ error: res.message });
    }
    setSubmitting(false);
  };

  if (isFinished) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0014', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'rgba(20,0,10,0.8)', padding: 40, borderRadius: 24, border: '1px solid rgba(251,146,60,0.3)', maxWidth: 500, width: '100%', textAlign: 'center' }}>
          {submitting ? (
            <h2 style={{ color: '#fb923c' }}>Calculating Score...</h2>
          ) : result?.error ? (
            <>
              <h2 style={{ color: '#ef4444' }}>Error Saving Score</h2>
              <p>{result.error}</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 48, fontWeight: 900, color: '#10b981', marginBottom: 16 }}>Scene Complete!</h1>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                Final Score: <span style={{ color: '#fb923c', fontSize: 32 }}>{result?.finalScore}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                Accuracy: {result?.accuracy.toFixed(1)}% | Streak: {result?.streakMultiplier}x
              </div>

              {result?.reward && (
                <div style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(251,146,60,0.1))', padding: 20, borderRadius: 16, border: '1px solid #ec4899', marginBottom: 24, animation: 'pulse 2s infinite' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <h3 style={{ color: '#fb923c', fontWeight: 800 }}>You Unlocked a Reward!</h3>
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 8, marginTop: 12, fontWeight: 900, letterSpacing: 2, color: 'white' }}>
                    {result.reward.code}
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{result.reward.discountPercent}% OFF • Expires in 7 days</p>
                </div>
              )}
            </>
          )}

          <button onClick={onBack} style={{ marginTop: 24, padding: '14px 32px', background: 'linear-gradient(135deg, #f97316, #ec4899)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 16 }}>
            Back to Play Zone
          </button>
        </div>
      </div>
    );
  }

  // Determine if questionText is a media URL
  const isVideoUrl = (url: string) => {
    return /^https?:\/\/.+\.(mp4|webm|mkv|ogg)$/i.test(url);
  };
  const isImageUrl = (url: string) => {
    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url) || (url.startsWith('http') && !isVideoUrl(url));
  };

  // Dynamic blur: starts at admin-configured max, clears over last 5 seconds
  const maxBlur = game.blurIntensity ?? 4;
  const blurAmount = timeLeft > 5
    ? maxBlur * (timeLeft / (game.timeLimit || 30))
    : Math.max(0, maxBlur * (timeLeft / 5) * 0.3);

  return (
    <div style={{ minHeight: '100vh', background: '#050510', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header Bar */}
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontWeight: 800, fontSize: 18 }}>←</button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{game.title}</h2>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Scene {currentIdx + 1} of {game.questions.length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 24, color: timeLeft < 10 ? '#ef4444' : '#10b981' }}>
            ⏱ {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 60 }}>
        <div style={{ maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fb923c', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 2 }}>
            Guess The Scene!
          </h2>

          <div style={{ width: '100%', maxWidth: 480, aspectRatio: '16/9', background: '#111', borderRadius: 20, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 32px rgba(0,0,0,0.5)', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentQ?.questionText && isVideoUrl(currentQ.questionText) ? (
              <video src={currentQ.questionText} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${blurAmount}px)`, transition: 'filter 1s linear' }} />
            ) : currentQ?.questionText && isImageUrl(currentQ.questionText) ? (
              <img src={currentQ.questionText} alt="Movie Scene" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${blurAmount}px)`, transition: 'filter 1s linear' }} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450/111111/FFFFFF?text=Scene+Not+Found'; }} />
            ) : (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <span style={{ fontSize: 48 }}>🎬</span>
                <p style={{ marginTop: 20, fontSize: 24, fontWeight: 700 }}>{currentQ?.questionText}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Which movie is this scene from?</p>
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%' }}>
            {currentQ?.options.map((opt: string, i: number) => {
              const isSelected = selectedOpt === opt;
              return (
                <button
                  key={i}
                  disabled={!!selectedOpt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '20px 24px',
                    background: isSelected ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 16,
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 700,
                    cursor: !!selectedOpt ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected ? '0 10px 20px rgba(16,185,129,0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                  onMouseEnter={e => {
                    if (!selectedOpt) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!selectedOpt) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
