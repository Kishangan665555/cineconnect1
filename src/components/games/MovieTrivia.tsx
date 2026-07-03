import React, { useState, useEffect } from 'react';
import { apiSubmitGameScore } from '../../services/apiService';

interface TriviaProps {
  game: any;
  onBack: () => void;
}

export default function MovieTrivia({ game, onBack }: TriviaProps) {
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
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, currentIdx, answers]); // Wait, currentIdx change doesn't reset timer right now.

  const currentQ = game.questions[currentIdx];

  const handleSelect = (opt: string) => {
    if (isFinished) return;
    setSelectedOpt(opt);
    
    // Auto advance after short delay
    setTimeout(() => {
      const newAnswers = [...answers, opt];
      setAnswers(newAnswers);
      setSelectedOpt(null);

      if (currentIdx + 1 < game.questions.length) {
        setCurrentIdx(currentIdx + 1);
        // Optional: Reset timer per question if you want, but for now we use global time
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
      score: 0, // Backend calculates real score
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
      <div style={{ minHeight: '100vh', background: '#0a0014', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 20 }}>
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
              <h1 style={{ fontSize: 48, fontWeight: 900, color: '#10b981', marginBottom: 16 }}>Game Over!</h1>
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

  return (
    <div style={{ minHeight: '100vh', background: '#0a0014', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontWeight: 800, fontSize: 18 }}>←</button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{game.title}</h2>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Question {currentIdx + 1} of {game.questions.length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 24, color: timeLeft < 10 ? '#ef4444' : '#10b981' }}>
            ⏱ {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 800, width: '100%' }}>
          
          <h1 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center', marginBottom: 48, lineHeight: 1.3 }}>
            {currentQ?.questionText || 'Loading...'}
          </h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {currentQ?.options.map((opt: string, i: number) => {
              const isSelected = selectedOpt === opt;
              return (
                <button
                  key={i}
                  disabled={!!selectedOpt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '24px',
                    background: isSelected ? 'linear-gradient(135deg, #f97316, #ec4899)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 16,
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 700,
                    cursor: !!selectedOpt ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected ? '0 10px 20px rgba(236,72,153,0.3)' : 'none'
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
