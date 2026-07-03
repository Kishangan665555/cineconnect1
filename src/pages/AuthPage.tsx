import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import RegStep1 from '../components/auth/RegStep1';
import RegStep2 from '../components/auth/RegStep2';
import TheatreRegStep1 from '../components/auth/TheatreRegStep1';
import TheatreRegStep2 from '../components/auth/TheatreRegStep2';
import TheatreRegStep3 from '../components/auth/TheatreRegStep3';
import { TermsModal } from '../components/auth/TermsModal';
import { apiTheatreOwnerRegister } from '../services/apiService';

type AuthMode = 'login' | 'register';
type AuthPanel = 'user' | 'theatre_owner' | 'admin';


const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── KEYFRAMES ── */
  @keyframes bgPulse {
    0%,100% { opacity:0.6; transform:scale(1) translate(0,0); }
    50%      { opacity:0.9; transform:scale(1.1) translate(-24px,18px); }
  }
  @keyframes bgPulse2 {
    0%,100% { opacity:0.4; transform:scale(1) translate(0,0); }
    50%      { opacity:0.75; transform:scale(1.14) translate(24px,-18px); }
  }
  @keyframes bgPulse3 {
    0%,100% { opacity:0.3; transform:scale(1.1) translate(0,0); }
    50%      { opacity:0.65; transform:scale(0.88) translate(-12px,24px); }
  }
  @keyframes gridAnim {
    0%   { background-position:0 0; }
    100% { background-position:40px 40px; }
  }
  @keyframes floatBadge {
    0%,100% { transform:translateY(0px); }
    50%      { transform:translateY(-6px); }
  }
  @keyframes shimmer {
    0%   { left:-100%; }
    100% { left:160%; }
  }
  @keyframes btnGlow {
    0%,100% { box-shadow:0 4px 0 rgba(120,30,60,0.6),0 0 24px rgba(251,146,60,0.35),0 0 60px rgba(236,72,153,0.15); }
    50%      { box-shadow:0 4px 0 rgba(120,30,60,0.6),0 0 40px rgba(251,146,60,0.65),0 0 90px rgba(236,72,153,0.3); }
  }
  @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spinRev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes corePulse {
    0%,100% { box-shadow:0 0 24px rgba(251,146,60,0.5),0 0 48px rgba(236,72,153,0.25),inset 0 0 24px rgba(251,146,60,0.1); }
    50%      { box-shadow:0 0 48px rgba(251,146,60,0.8),0 0 96px rgba(236,72,153,0.45),inset 0 0 36px rgba(251,146,60,0.2); }
  }
  @keyframes scanLine {
    0%   { top:10%; opacity:0; }
    10%  { opacity:1; }
    90%  { opacity:1; }
    100% { top:88%; opacity:0; }
  }
  @keyframes particleRise {
    0%   { transform:translateY(0) translateX(0) rotate(0deg) scale(1); opacity:0; }
    8%   { opacity:0.9; }
    92%  { opacity:0.35; }
    100% { transform:translateY(-110vh) translateX(var(--dx,20px)) rotate(540deg) scale(0.3); opacity:0; }
  }
  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(32px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes fadeSlideIn {
    from { opacity:0; transform:translateX(-12px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes shake {
    0%,100% { transform:translateX(0); }
    15%     { transform:translateX(-9px); }
    35%     { transform:translateX(9px); }
    55%     { transform:translateX(-6px); }
    75%     { transform:translateX(6px); }
    90%     { transform:translateX(-3px); }
  }
  @keyframes successScale {
    0%   { transform:scale(0) rotate(-20deg); opacity:0; }
    65%  { transform:scale(1.18) rotate(6deg); }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
  }
  @keyframes tickDraw {
    from { stroke-dashoffset:80; }
    to   { stroke-dashoffset:0; }
  }
  @keyframes logoGlow {
    0%,100% { filter:drop-shadow(0 0 14px rgba(251,146,60,0.4)) drop-shadow(0 0 28px rgba(236,72,153,0.2)); }
    50%      { filter:drop-shadow(0 0 28px rgba(251,146,60,0.75)) drop-shadow(0 0 56px rgba(236,72,153,0.4)); }
  }
  @keyframes logoFloat {
    0%,100% { transform:translateY(0px) rotate(0deg); }
    33%     { transform:translateY(-10px) rotate(0.8deg); }
    66%     { transform:translateY(-5px) rotate(-0.5deg); }
  }
  @keyframes adminPulse {
    0%,100% { box-shadow:0 0 14px rgba(239,68,68,0.3); }
    50%      { box-shadow:0 0 30px rgba(239,68,68,0.7),0 0 60px rgba(239,68,68,0.3); }
  }
  @keyframes beamMove {
    0%   { transform:translateX(-120%) skewX(-20deg); opacity:0; }
    10%  { opacity:0.08; }
    90%  { opacity:0.04; }
    100% { transform:translateX(220%) skewX(-20deg); opacity:0; }
  }
  @keyframes beamMove2 {
    0%   { transform:translateX(-120%) skewX(-15deg); opacity:0; }
    10%  { opacity:0.06; }
    90%  { opacity:0.03; }
    100% { transform:translateX(220%) skewX(-15deg); opacity:0; }
  }
  @keyframes gradShift {
    0%   { background-position:0% 50%; }
    50%  { background-position:100% 50%; }
    100% { background-position:0% 50%; }
  }
  @keyframes haloRing {
    0%,100% { transform:scale(1); opacity:0.35; }
    50%      { transform:scale(1.1); opacity:0.65; }
  }
  @keyframes ripple {
    0%   { transform:scale(0); opacity:0.4; }
    100% { transform:scale(4); opacity:0; }
  }
  @keyframes cardEntrance {
    from { opacity:0; transform:translateY(20px) scale(0.95); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  /* ADMIN PILL ANIMATIONS */
  @keyframes adminPillGlow {
    0%,100% { box-shadow:0 0 8px rgba(239,68,68,0.12),inset 0 1px 0 rgba(255,255,255,0.05); }
    50%     { box-shadow:0 0 18px rgba(239,68,68,0.28),0 0 4px rgba(251,146,60,0.08),inset 0 1px 0 rgba(255,255,255,0.08); }
  }
  @keyframes adminDotPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:0.4; transform:scale(0.6); }
  }
  @keyframes leftMorphBlob1 {
    0%,100% { border-radius:60% 40% 70% 30%/50% 60% 40% 70%; transform:translate(0,0) scale(1); }
    33%     { border-radius:40% 60% 30% 70%/60% 40% 70% 50%; transform:translate(20px,-15px) scale(1.08); }
    66%     { border-radius:70% 30% 60% 40%/40% 70% 50% 60%; transform:translate(-15px,20px) scale(0.95); }
  }
  @keyframes leftMorphBlob2 {
    0%,100% { border-radius:40% 60% 50% 50%/60% 40% 60% 40%; transform:translate(0,0) scale(1); }
    33%     { border-radius:60% 40% 40% 60%/40% 60% 40% 60%; transform:translate(-20px,15px) scale(1.1); }
    66%     { border-radius:50% 50% 60% 40%/50% 50% 40% 60%; transform:translate(15px,-20px) scale(0.92); }
  }
  @keyframes rightMorphBlob {
    0%,100% { border-radius:55% 45% 60% 40%/45% 55% 45% 55%; transform:scale(1); }
    50%     { border-radius:40% 60% 45% 55%/60% 40% 60% 40%; transform:scale(1.12); }
  }
  @keyframes cinemaReel {
    0%   { transform:rotate(0deg); }
    100% { transform:rotate(360deg); }
  }
  @keyframes orbitA {
    0%   { transform:rotate(0deg) translateX(70px) rotate(0deg); }
    100% { transform:rotate(360deg) translateX(70px) rotate(-360deg); }
  }
  @keyframes orbitB {
    0%   { transform:rotate(0deg) translateX(88px) rotate(0deg); }
    100% { transform:rotate(360deg) translateX(88px) rotate(-360deg); }
  }
  @keyframes orbitC {
    0%   { transform:rotate(180deg) translateX(105px) rotate(-180deg); }
    100% { transform:rotate(540deg) translateX(105px) rotate(-540deg); }
  }
  @keyframes featureCardHover {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-4px); }
  }
  @keyframes statCountUp {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes rightBeam {
    0%   { transform:translateY(-120%) skewY(-8deg); opacity:0; }
    15%  { opacity:0.05; }
    85%  { opacity:0.025; }
    100% { transform:translateY(120%) skewY(-8deg); opacity:0; }
  }
  @keyframes leftPanelFloat {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-6px); }
  }
  @keyframes badgePulse {
    0%,100% { transform:scale(1); box-shadow:0 0 0 0 rgba(251,146,60,0.4); }
    50%      { transform:scale(1.06); box-shadow:0 0 0 6px rgba(251,146,60,0); }
  }
  @keyframes inputIconWobble {
    0%,100% { transform:translateY(-50%) rotate(0deg); }
    25%     { transform:translateY(-50%) rotate(-8deg); }
    75%     { transform:translateY(-50%) rotate(8deg); }
  }
  @keyframes adminEntrance {
    0%   { opacity:0; transform:translateY(12px) scale(0.96); }
    100% { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes adminIconSpin {
    0%   { transform:rotate(0deg) scale(1); }
    100% { transform:rotate(360deg) scale(1); }
  }
  @keyframes securityBadgePulse {
    0%,100% { opacity:0.7; transform:scale(1); }
    50%     { opacity:1; transform:scale(1.04); }
  }
  @keyframes dotBlink {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:0.4; transform:scale(0.7); }
  }
  @keyframes glowRingExpand {
    0%   { transform:scale(0.8); opacity:0.8; }
    100% { transform:scale(1.8); opacity:0; }
  }
  @keyframes typewriterCursor {
    0%,100% { opacity:1; }
    50%     { opacity:0; }
  }
  @keyframes aiOrbPulse {
    0%,100% { box-shadow:0 0 20px rgba(139,92,246,0.6),0 0 60px rgba(139,92,246,0.3),0 0 100px rgba(99,102,241,0.15),inset 0 0 20px rgba(139,92,246,0.2); transform:scale(1) translateY(0); }
    33%      { box-shadow:0 0 35px rgba(168,85,247,0.8),0 0 80px rgba(139,92,246,0.5),0 0 130px rgba(99,102,241,0.25),inset 0 0 30px rgba(168,85,247,0.3); transform:scale(1.06) translateY(-4px); }
    66%      { box-shadow:0 0 25px rgba(236,72,153,0.6),0 0 65px rgba(236,72,153,0.3),0 0 110px rgba(236,72,153,0.15),inset 0 0 25px rgba(236,72,153,0.2); transform:scale(0.97) translateY(2px); }
  }
  @keyframes aiOrbRotate {
    0%   { transform:rotate(0deg); }
    100% { transform:rotate(360deg); }
  }
  @keyframes streakMove1 {
    0%   { transform:translateX(-200%) rotate(-35deg); opacity:0; }
    8%   { opacity:0.12; }
    92%  { opacity:0.06; }
    100% { transform:translateX(350%) rotate(-35deg); opacity:0; }
  }
  @keyframes streakMove2 {
    0%   { transform:translateX(-200%) rotate(-25deg); opacity:0; }
    10%  { opacity:0.08; }
    90%  { opacity:0.04; }
    100% { transform:translateX(350%) rotate(-25deg); opacity:0; }
  }
  @keyframes neonBorderSpin {
    0%   { background-position:0% 50%; }
    50%  { background-position:100% 50%; }
    100% { background-position:0% 50%; }
  }
  @keyframes cardGlowPulse {
    0%,100% { box-shadow:0 0 0 1px rgba(251,146,60,0.05),0 32px 100px rgba(0,0,0,0.75),0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.09),0 0 40px rgba(251,146,60,0.04); }
    50%      { box-shadow:0 0 0 1px rgba(251,146,60,0.08),0 32px 100px rgba(0,0,0,0.75),0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.09),0 0 80px rgba(251,146,60,0.08),0 0 120px rgba(236,72,153,0.05); }
  }
  @keyframes featCardGlow {
    0%,100% { border-color:rgba(255,255,255,0.07); }
    50%      { border-color:rgba(255,255,255,0.1); }
  }
  @keyframes inputFocusRing {
    0%   { box-shadow:0 0 0 0 rgba(251,146,60,0.4); }
    100% { box-shadow:0 0 0 8px rgba(251,146,60,0); }
  }
  @keyframes orbRingExpand {
    0%   { transform:scale(1); opacity:0.6; }
    100% { transform:scale(2.2); opacity:0; }
  }
  @keyframes bgGradientShift {
    0%   { background-position:0% 0%; }
    33%  { background-position:100% 50%; }
    66%  { background-position:50% 100%; }
    100% { background-position:0% 0%; }
  }
  @keyframes depthFloat {
    0%,100% { transform:perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px); }
    25%      { transform:perspective(800px) rotateX(0.5deg) rotateY(0.3deg) translateY(-3px); }
    75%      { transform:perspective(800px) rotateX(-0.3deg) rotateY(-0.5deg) translateY(-5px); }
  }

  /* ── ROOT ── */
  .auth-root {
    display:flex; min-height:100vh; width:100%;
    font-family:'Inter',sans-serif;
    background: #160010;
    overflow:hidden; position:relative;
  }
  .auth-bg-gradient {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse 110% 80% at 80% 10%, rgba(255,70,0,0.35) 0%, rgba(180,20,0,0.18) 40%, transparent 65%),
      radial-gradient(ellipse 80% 90% at 5% 90%, rgba(220,10,60,0.3) 0%, rgba(140,0,40,0.15) 40%, transparent 65%),
      radial-gradient(ellipse 60% 50% at 50% 50%, rgba(80,0,20,0.2) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 30% 20%, rgba(255,60,0,0.12) 0%, transparent 60%);
    animation:bgGradientShift 18s ease infinite;
  }
  .auth-arc-layer {
    position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden;
  }
  .auth-arc1 {
    position:absolute;
    width:180%; height:180%;
    top:-80%; left:-20%;
    border-radius:50%;
    border:1.5px solid transparent;
    border-top-color:rgba(255,100,20,0.35);
    border-right-color:rgba(255,60,10,0.2);
    animation:arcRotate1 22s linear infinite;
    filter:blur(1px);
  }
  .auth-arc2 {
    position:absolute;
    width:140%; height:140%;
    top:-30%; left:10%;
    border-radius:50%;
    border:1px solid transparent;
    border-bottom-color:rgba(220,30,80,0.3);
    border-left-color:rgba(200,20,60,0.18);
    animation:arcRotate2 30s linear infinite reverse;
    filter:blur(0.8px);
  }
  .auth-arc3 {
    position:absolute;
    width:220%; height:120%;
    top:40%; left:-60%;
    border-radius:50%;
    border:1px solid transparent;
    border-top-color:rgba(255,80,0,0.22);
    animation:arcRotate1 40s linear infinite;
    filter:blur(1.5px);
  }
  .auth-streak-h1 {
    position:absolute; top:18%; left:-10%; width:80%; height:2px;
    background:linear-gradient(90deg,transparent,rgba(255,100,20,0.7),rgba(255,60,10,0.4),transparent);
    border-radius:50%;
    animation:streakHoriz1 8s ease-in-out infinite;
    filter:blur(1px);
    box-shadow:0 0 10px rgba(255,100,0,0.4);
  }
  .auth-streak-h2 {
    position:absolute; top:62%; right:-10%; width:70%; height:1.5px;
    background:linear-gradient(90deg,transparent,rgba(220,40,80,0.5),rgba(255,80,20,0.3),transparent);
    border-radius:50%;
    animation:streakHoriz2 12s ease-in-out infinite 3s;
    filter:blur(0.8px);
    box-shadow:0 0 8px rgba(220,40,80,0.3);
  }
  .auth-streak-h3 {
    position:absolute; top:80%; left:-5%; width:55%; height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,120,0,0.4),transparent);
    animation:streakHoriz1 16s ease-in-out infinite 7s;
    filter:blur(1px);
  }
  @keyframes arcRotate1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes arcRotate2 { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes streakHoriz1 { 0%,100%{transform:translateX(-30%) scaleX(0.6);opacity:0.4} 50%{transform:translateX(20%) scaleX(1.2);opacity:1} }
  @keyframes streakHoriz2 { 0%,100%{transform:translateX(10%) scaleX(0.5);opacity:0.3} 50%{transform:translateX(-15%) scaleX(1.1);opacity:0.8} }

  /* ── LEFT PANEL ── */
  .auth-left {
    position:relative; width:45%; min-height:100vh;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:48px 44px;
    background:rgba(0,0,0,0);
    overflow:hidden; z-index:1;
  }
  .auth-left-bg1 {
    position:absolute; inset:0; pointer-events:none;
    background:
      radial-gradient(ellipse 65% 55% at 18% 28%,rgba(251,100,20,0.14) 0%,transparent 70%),
      radial-gradient(ellipse 55% 65% at 82% 72%,rgba(220,40,80,0.12) 0%,transparent 70%),
      radial-gradient(ellipse 45% 45% at 50% 50%,rgba(200,60,0,0.06) 0%,transparent 70%);
    animation:bgPulse 9s ease-in-out infinite;
  }
  .auth-left-blob1 {
    position:absolute; top:-60px; left:-80px; width:320px; height:320px;
    background:radial-gradient(circle,rgba(220,80,20,0.12) 0%,transparent 70%);
    animation:leftMorphBlob1 12s ease-in-out infinite;
    pointer-events:none;
  }
  .auth-left-blob2 {
    position:absolute; bottom:-80px; right:-60px; width:280px; height:280px;
    background:radial-gradient(circle,rgba(200,30,60,0.1) 0%,transparent 70%);
    animation:leftMorphBlob2 15s ease-in-out infinite 2s;
    pointer-events:none;
  }
  .auth-left-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(251,146,60,0.045) 1px,transparent 1px),
      linear-gradient(90deg,rgba(251,146,60,0.045) 1px,transparent 1px);
    background-size:40px 40px;
    animation:gridAnim 7s linear infinite;
  }
  .auth-left-beam1 {
    position:absolute; top:0; left:15%; width:120px; height:100%;
    background:linear-gradient(180deg,transparent,rgba(251,146,60,0.06),transparent);
    animation:beamMove 8s ease-in-out infinite;
    pointer-events:none;
  }
  .auth-left-beam2 {
    position:absolute; top:0; left:60%; width:80px; height:100%;
    background:linear-gradient(180deg,transparent,rgba(236,72,153,0.05),transparent);
    animation:beamMove2 12s ease-in-out infinite 3s;
    pointer-events:none;
  }
  .auth-left-accent {
    position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent 0%,#fb923c 25%,#f97316 45%,#ec4899 70%,#10b981 90%,transparent 100%);
    background-size:200% 100%;
    animation:gradShift 5s ease-in-out infinite;
    box-shadow:0 0 12px rgba(251,146,60,0.4);
  }
  .auth-left-accent-b {
    position:absolute; bottom:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(251,146,60,0.3),rgba(236,72,153,0.2),transparent);
  }

  /* ── RIGHT PANEL ── */
  .auth-right {
    position:relative; width:55%; min-height:100vh;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:48px 48px;
    background:transparent;
    overflow:hidden;
    border-left:1px solid rgba(255,80,20,0.08);
  }
  .auth-right-bg {
    position:absolute; inset:0; pointer-events:none;
    background:
      radial-gradient(ellipse 75% 65% at 82% 18%,rgba(220,80,20,0.18) 0%,transparent 60%),
      radial-gradient(ellipse 65% 75% at 18% 82%,rgba(180,20,60,0.14) 0%,transparent 60%),
      radial-gradient(ellipse 55% 45% at 50% 50%,rgba(200,50,10,0.06) 0%,transparent 60%);
    animation:bgPulse2 11s ease-in-out infinite;
  }
  .auth-right-blob {
    position:absolute; top:10%; right:5%; width:380px; height:380px;
    background:radial-gradient(circle,rgba(220,80,20,0.14) 0%,rgba(180,20,60,0.06) 50%,transparent 70%);
    animation:rightMorphBlob 14s ease-in-out infinite;
    pointer-events:none;
  }
  .auth-right-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(200,60,20,0.03) 1px,transparent 1px),
      linear-gradient(90deg,rgba(200,60,20,0.03) 1px,transparent 1px);
    background-size:50px 50px;
  }
  .auth-right-glow {
    position:absolute; bottom:-100px; right:-100px; width:400px; height:400px;
    background:radial-gradient(circle,rgba(220,80,20,0.18) 0%,transparent 70%);
    border-radius:50%;
    animation:bgPulse3 8s ease-in-out infinite;
    pointer-events:none;
  }
  .auth-right-glow2 {
    position:absolute; top:-80px; left:-80px; width:300px; height:300px;
    background:radial-gradient(circle,rgba(180,20,60,0.14) 0%,transparent 70%);
    border-radius:50%;
    animation:bgPulse2 10s ease-in-out infinite;
    pointer-events:none;
  }
  .auth-right-beam {
    position:absolute; top:0; left:10%; width:120px; height:100%;
    background:linear-gradient(90deg,transparent,rgba(220,80,20,0.04),transparent);
    animation:rightBeam 18s ease-in-out infinite 2s;
    pointer-events:none;
  }

  /* ── FORM CARD ── */
  .auth-card {
    position:relative; width:100%; max-width:420px;
    background:rgba(15,3,5,0.82);
    border:1px solid rgba(255,100,30,0.45);
    border-radius:28px; padding:40px 38px;
    backdrop-filter:blur(36px) saturate(1.6);
    box-shadow:
      0 0 0 1px rgba(255,100,30,0.12),
      0 32px 100px rgba(0,0,0,0.85),
      0 8px 32px rgba(0,0,0,0.6),
      inset 0 1px 0 rgba(255,150,50,0.12),
      inset 0 -1px 0 rgba(0,0,0,0.5),
      0 0 60px rgba(255,100,30,0.15),
      0 0 120px rgba(220,60,20,0.08);
    z-index:2;
    animation:fadeSlideUp 0.7s cubic-bezier(0.34,1.3,0.64,1) both;
    transition:box-shadow 0.4s ease,border-color 0.4s ease,transform 0.4s ease;
  }
  .auth-card:hover {
    border-color:rgba(255,120,30,0.65);
    box-shadow:
      0 0 0 1px rgba(255,100,30,0.18),
      0 32px 100px rgba(0,0,0,0.85),
      0 8px 32px rgba(0,0,0,0.6),
      inset 0 1px 0 rgba(255,150,50,0.14),
      0 0 80px rgba(255,100,30,0.22),
      0 0 160px rgba(220,60,20,0.12);
    transform:translateY(-2px);
  }
  .auth-card::before {
    content:''; position:absolute; top:0; left:5%; right:5%; height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,130,30,0.9),rgba(255,100,20,1),rgba(255,80,20,0.8),transparent);
    border-radius:0 0 100% 100%;
    box-shadow:0 0 20px rgba(255,100,30,0.6);
  }
  .auth-card::after {
    content:''; position:absolute; bottom:0; left:15%; right:15%; height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,100,30,0.35),rgba(220,60,20,0.25),transparent);
  }
  .auth-card-glow-border {
    position:absolute; inset:-1px; border-radius:29px; pointer-events:none; z-index:-1;
    background:linear-gradient(135deg,rgba(251,100,20,0.5),rgba(220,40,80,0.4),rgba(180,20,60,0.3),rgba(251,100,20,0.5));
    background-size:300% 300%;
    animation:neonBorderSpin 4s ease infinite;
    mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite:exclude; -webkit-mask-composite:xor;
    padding:1px;
  }

  /* ── BADGE ── */
  .auth-badge {
    display:inline-flex; align-items:center; gap:7px;
    padding:7px 16px;
    background:rgba(251,146,60,0.07);
    border:1px solid rgba(251,146,60,0.22);
    border-radius:100px;
    font-size:11.5px; font-weight:600; letter-spacing:0.4px;
    color:#fb923c; margin-bottom:28px;
    animation:floatBadge 3.5s ease-in-out infinite;
    backdrop-filter:blur(8px);
    box-shadow:0 0 16px rgba(251,146,60,0.08),inset 0 1px 0 rgba(255,255,255,0.06);
  }

  /* ── ROLE SEGMENTED CONTROL ── */
  .auth-role-segment {
    display:flex;
    background:rgba(0,0,0,0.45);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; padding:4px;
    margin-bottom:10px;
    box-shadow:inset 0 2px 6px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.03);
    gap:3px;
  }
  .auth-role-seg-btn {
    flex:1; display:flex; align-items:center; justify-content:center; gap:7px;
    padding:10px 8px;
    border:1px solid transparent; border-radius:11px;
    cursor:pointer; background:transparent;
    font-family:'Inter',sans-serif; font-size:12px; font-weight:700;
    color:rgba(255,255,255,0.38); letter-spacing:0.3px;
    transition:all 0.28s cubic-bezier(0.34,1.56,0.64,1);
    position:relative; overflow:hidden; white-space:nowrap;
  }
  .auth-role-seg-btn:hover:not(.seg-active-user):not(.seg-active-theatre) {
    color:rgba(255,255,255,0.65); background:rgba(255,255,255,0.05);
  }
  .auth-role-seg-btn.seg-active-user {
    background:linear-gradient(135deg,rgba(251,146,60,0.22),rgba(236,72,153,0.18));
    border-color:rgba(251,146,60,0.45); color:#fb923c;
    box-shadow:0 3px 14px rgba(251,146,60,0.28),inset 0 1px 0 rgba(251,146,60,0.15);
    transform:translateY(-1px);
  }
  .auth-role-seg-btn.seg-active-theatre {
    background:linear-gradient(135deg,rgba(245,158,11,0.22),rgba(251,146,60,0.14));
    border-color:rgba(245,158,11,0.45); color:#f59e0b;
    box-shadow:0 3px 14px rgba(245,158,11,0.28),inset 0 1px 0 rgba(245,158,11,0.15);
    transform:translateY(-1px);
  }
  .auth-role-seg-icon {
    width:26px; height:26px; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    background:rgba(255,255,255,0.05); flex-shrink:0; transition:all 0.28s;
  }
  .seg-active-user .auth-role-seg-icon {
    background:rgba(251,146,60,0.2);
    box-shadow:0 0 10px rgba(251,146,60,0.25);
  }
  .seg-active-theatre .auth-role-seg-icon {
    background:rgba(245,158,11,0.2);
    box-shadow:0 0 10px rgba(245,158,11,0.25);
  }

  /* ── COMPACT ADMIN PILL ── */
  .auth-admin-pill {
    display:inline-flex; align-items:center; gap:8px;
    padding:8px 18px 8px 12px;
    background:rgba(239,68,68,0.06);
    border:1px solid rgba(239,68,68,0.2);
    border-radius:100px; cursor:pointer;
    font-family:'Inter',sans-serif;
    transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    backdrop-filter:blur(8px);
    animation:adminPillGlow 3s ease-in-out infinite;
    position:relative; overflow:hidden;
  }
  .auth-admin-pill::after {
    content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(239,68,68,0.08),transparent);
    animation:shimmer 4s ease-in-out infinite; pointer-events:none;
  }
  .auth-admin-pill:hover {
    background:rgba(239,68,68,0.12);
    border-color:rgba(239,68,68,0.45);
    transform:translateY(-2px) scale(1.03);
    box-shadow:0 6px 20px rgba(239,68,68,0.2),0 0 0 1px rgba(239,68,68,0.1);
  }
  .auth-admin-pill.pill-active {
    background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(185,28,28,0.1));
    border-color:rgba(239,68,68,0.5);
    box-shadow:0 0 20px rgba(239,68,68,0.2);
  }
  .auth-admin-pill-icon {
    width:26px; height:26px; border-radius:50%;
    background:linear-gradient(135deg,rgba(239,68,68,0.22),rgba(185,28,28,0.12));
    border:1px solid rgba(239,68,68,0.3);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:all 0.3s;
  }
  .auth-admin-pill:hover .auth-admin-pill-icon {
    background:linear-gradient(135deg,rgba(239,68,68,0.35),rgba(185,28,28,0.2));
    border-color:rgba(239,68,68,0.55);
    box-shadow:0 0 12px rgba(239,68,68,0.25);
  }
  .auth-admin-pill-label {
    font-size:12px; font-weight:700; color:rgba(239,68,68,0.85);
    letter-spacing:0.4px;
  }
  .auth-admin-pill-dot {
    width:5px; height:5px; border-radius:50%;
    background:#ef4444; flex-shrink:0;
    box-shadow:0 0 6px rgba(239,68,68,0.7);
    animation:adminDotPulse 2s ease-in-out infinite;
  }
  .auth-admin-pill-chevron {
    font-size:14px; color:rgba(239,68,68,0.5); font-weight:300; line-height:1;
    transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .auth-admin-pill:hover .auth-admin-pill-chevron {
    color:#ef4444; transform:translateX(3px);
  }

  /* ── MODE TABS ── */
  .auth-mode-tabs {
    display:flex; gap:4px;
    background:rgba(255,255,255,0.035);
    border:1px solid rgba(255,255,255,0.055);
    border-radius:14px; padding:5px; margin-bottom:28px;
    box-shadow:inset 0 1px 3px rgba(0,0,0,0.3);
  }
  .auth-mode-tab {
    flex:1; padding:10px; border-radius:10px; border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:13px; font-weight:600;
    transition:all 0.3s cubic-bezier(0.34,1.4,0.64,1);
    color:rgba(255,255,255,0.38); background:transparent; letter-spacing:0.2px;
  }
  .auth-mode-tab.active {
    background:linear-gradient(135deg,#ff8c00 0%,#ff6600 50%,#ff4500 100%);
    color:white;
    box-shadow:0 4px 20px rgba(255,120,0,0.5),0 2px 8px rgba(255,69,0,0.3);
    transform:scale(1.02);
  }
  .auth-mode-tab:not(.active):hover { color:rgba(255,255,255,0.65); background:rgba(255,255,255,0.04); }

  /* ── INPUTS ── */
  .auth-field { margin-bottom:18px; }
  .auth-label {
    display:block; font-size:11px; font-weight:700; letter-spacing:0.8px;
    color:rgba(255,255,255,0.45); text-transform:uppercase; margin-bottom:8px;
    transition:color 0.3s;
  }
  .auth-field:focus-within .auth-label { color:rgba(251,146,60,0.85); }
  .auth-input-wrap { position:relative; }
  .auth-input-wrap::after {
    content:''; position:absolute; bottom:-1px; left:10%; right:10%; height:2px;
    background:linear-gradient(90deg,transparent,#fb923c,#ec4899,#8b5cf6,transparent);
    transform:scaleX(0); transform-origin:center;
    transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
    border-radius:999px; pointer-events:none;
  }
  .auth-input-wrap:focus-within::after { transform:scaleX(1); }
  .auth-input-left-icon {
    position:absolute; left:14px; top:50%; transform:translateY(-50%);
    color:rgba(255,255,255,0.25); pointer-events:none; transition:color 0.3s;
  }
  .auth-input-wrap:focus-within .auth-input-left-icon { color:rgba(251,146,60,0.7); }
  .auth-input {
    width:100%; padding:14px 18px 14px 44px;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:14px; color:rgba(255,255,255,0.93);
    font-family:'Inter',sans-serif; font-size:14px; font-weight:400;
    transition:all 0.32s cubic-bezier(0.4,0,0.2,1);
    outline:none; appearance:none; letter-spacing:0.1px;
    box-shadow:inset 0 2px 4px rgba(0,0,0,0.3),inset 0 -1px 0 rgba(255,255,255,0.04);
  }
  .auth-input::placeholder { color:rgba(255,255,255,0.2); }
  .auth-input:focus {
    border-color:rgba(251,146,60,0.55); background:rgba(251,146,60,0.055);
    box-shadow:0 0 0 4px rgba(251,146,60,0.1),0 0 20px rgba(251,146,60,0.08),inset 0 1px 3px rgba(0,0,0,0.2);
    transform:translateY(-1px);
  }
  .auth-input.error { border-color:rgba(239,68,68,0.55); box-shadow:0 0 0 4px rgba(239,68,68,0.1); }
  .auth-input-icon {
    position:absolute; right:14px; top:50%; transform:translateY(-50%);
    color:rgba(255,255,255,0.22); cursor:pointer;
    background:none; border:none; padding:4px;
    transition:all 0.25s; border-radius:7px;
  }
  .auth-input-icon:hover { color:rgba(255,255,255,0.7); background:rgba(255,255,255,0.07); }
  .auth-error {
    font-size:11px; color:#f87171; margin-top:6px;
    display:flex; align-items:center; gap:5px;
    animation:fadeSlideIn 0.25s ease both;
  }

  /* ── SUBMIT BUTTON ── */
  .auth-submit {
    width:100%; padding:17px;
    background:linear-gradient(135deg,#ff9500 0%,#ff5500 40%,#ff2060 80%,#cc0040 100%);
    background-size:200% 200%; border:none; border-radius:16px;
    color:white; font-family:'Inter',sans-serif;
    font-size:15px; font-weight:800; letter-spacing:0.5px;
    cursor:pointer; position:relative; overflow:hidden;
    transition:all 0.38s cubic-bezier(0.34,1.4,0.64,1);
    margin-top:12px;
    animation:btnGlow 3.5s ease-in-out infinite;
    box-shadow:0 5px 0 rgba(100,10,20,0.8),0 0 40px rgba(255,120,0,0.55),0 0 80px rgba(255,30,80,0.2);
  }
  .auth-submit:hover:not(:disabled) {
    transform:translateY(-5px) scale(1.02);
    box-shadow:0 10px 0 rgba(100,10,20,0.8),0 0 70px rgba(255,120,0,0.7),0 0 130px rgba(255,30,80,0.35);
    background-position:right center;
  }
  .auth-submit:active:not(:disabled) {
    transform:translateY(2px) scale(0.985);
    box-shadow:0 2px 0 rgba(100,20,0,0.8),0 0 25px rgba(255,100,0,0.4);
  }
  .auth-submit:disabled { opacity:0.5; cursor:not-allowed; animation:none; }
  .auth-submit-shine {
    position:absolute; top:0; left:-100%; width:55%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent);
    transform:skewX(-22deg);
    animation:shimmer 2.8s ease-in-out infinite;
    pointer-events:none;
  }
  .auth-submit-top {
    position:absolute; top:0; left:0; right:0; height:50%;
    background:linear-gradient(180deg,rgba(255,255,255,0.12),transparent);
    border-radius:15px 15px 0 0; pointer-events:none;
  }
  .auth-submit-ripple {
    position:absolute; border-radius:50%;
    background:rgba(255,255,255,0.3); width:10px; height:10px;
    animation:ripple 0.6s ease-out forwards; pointer-events:none;
  }
  .auth-submit-admin {
    background:linear-gradient(135deg,#dc2626,#b91c1c,#991b1b);
    background-size:200% 200%;
    box-shadow:0 4px 0 rgba(80,0,0,0.85),0 0 28px rgba(239,68,68,0.45);
    animation:adminPulse 2.2s ease-in-out infinite;
  }
  .auth-submit-admin:hover:not(:disabled) {
    box-shadow:0 8px 0 rgba(80,0,0,0.85),0 0 60px rgba(239,68,68,0.65);
  }

  /* ── SECURE TEXT ── */
  .auth-secure {
    display:flex; align-items:center; justify-content:center; gap:7px;
    font-size:11px; color:rgba(255,255,255,0.25); margin-top:18px; letter-spacing:0.4px;
  }

  /* ── RIGHT PANEL LOGO ── */
  .auth-logo-wrap {
    position:relative; z-index:2;
    display:flex; flex-direction:column; align-items:center;
    margin-bottom:40px;
    animation:logoGlow 4.5s ease-in-out infinite,logoFloat 6s ease-in-out infinite;
  }
  .auth-logo-reel {
    position:relative; width:168px; height:168px;
    margin-bottom:24px; flex-shrink:0;
  }
  .auth-reel-halo {
    position:absolute; inset:-16px; border-radius:50%;
    background:radial-gradient(circle,rgba(251,146,60,0.12) 0%,rgba(236,72,153,0.06) 50%,transparent 70%);
    animation:haloRing 4s ease-in-out infinite; pointer-events:none;
  }
  .auth-reel-outer {
    position:absolute; inset:0; border-radius:50%;
    animation:spinSlow 12s linear infinite;
  }
  .auth-reel-mid {
    position:absolute; inset:22px; border-radius:50%;
    animation:spinRev 8s linear infinite;
  }
  .auth-reel-inner-ring {
    position:absolute; inset:44px; border-radius:50%;
    animation:cinemaReel 10s linear infinite;
  }
  .auth-reel-core {
    position:absolute; inset:58px; border-radius:50%;
    background:radial-gradient(circle,rgba(251,146,60,0.3) 0%,rgba(236,72,153,0.2) 50%,rgba(10,0,20,0.9) 100%);
    display:flex; align-items:center; justify-content:center;
    animation:corePulse 3s ease-in-out infinite;
  }
  .auth-reel-scan {
    position:absolute; left:58px; right:58px; height:1.5px;
    background:linear-gradient(90deg,transparent,#10b981,transparent);
    box-shadow:0 0 8px rgba(16,185,129,0.9);
    animation:scanLine 2.5s ease-in-out infinite;
    pointer-events:none; border-radius:999px;
  }
  .auth-orbit-dot {
    position:absolute; top:50%; left:50%;
    width:10px; height:10px; border-radius:50%; margin:-5px;
  }

  /* ── FEATURE CARDS ── */
  .auth-cards-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:12px;
    width:100%; max-width:420px; margin-bottom:24px;
    position:relative; z-index:2;
  }
  .auth-feat-card {
    background:rgba(20,0,8,0.65);
    border:1px solid rgba(200,60,20,0.2);
    border-radius:16px; padding:14px 16px;
    backdrop-filter:blur(20px) saturate(1.5);
    transition:all 0.35s cubic-bezier(0.34,1.4,0.64,1);
    position:relative; overflow:hidden;
    animation:cardEntrance 0.6s cubic-bezier(0.34,1.3,0.64,1) both;
    cursor:default;
    display:flex; align-items:center; gap:12px;
  }
  .auth-feat-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(220,80,30,0.3),transparent);
  }
  .auth-feat-card:hover {
    transform:translateY(-6px) scale(1.03);
    background:rgba(30,5,12,0.8);
    box-shadow:0 16px 40px rgba(0,0,0,0.5), var(--card-glow,0 0 25px rgba(220,80,30,0.15));
    border-color:rgba(220,80,30,0.4);
  }
  .auth-feat-card:hover .auth-feat-icon { transform:scale(1.15) rotate(8deg); }
  .auth-feat-card .auth-feat-glow-bar {
    position:absolute; bottom:0; left:0; right:0; height:2px;
    background:var(--card-color,#fb923c); opacity:0;
    transition:opacity 0.35s ease; border-radius:0 0 16px 16px;
  }
  .auth-feat-card:hover .auth-feat-glow-bar { opacity:0.6; box-shadow:0 0 10px var(--card-color,#fb923c); }

  /* ── STATS ── */
  .auth-stats {
    display:flex; gap:0; width:100%; max-width:380px;
    background:rgba(255,255,255,0.025);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:16px; overflow:hidden;
    position:relative; z-index:2;
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);
  }
  .auth-stat {
    flex:1; padding:16px 12px; text-align:center;
    position:relative;
    animation:statCountUp 0.6s ease both;
  }
  .auth-stat:not(:last-child)::after {
    content:''; position:absolute; right:0; top:20%; bottom:20%;
    width:1px; background:rgba(255,255,255,0.07);
  }

  /* ── ROLE PILL INDICATORS ── */
  .auth-role-pills {
    display:flex; gap:8px; margin-top:20px;
    position:relative; z-index:2;
  }
  .auth-role-pill {
    padding:5px 14px; border-radius:100px; font-size:10.5px; font-weight:600;
    border:1px solid; letter-spacing:0.3px;
    transition:all 0.3s cubic-bezier(0.34,1.4,0.64,1);
  }

  /* ── SUCCESS ── */
  .auth-success {
    position:fixed; inset:0; z-index:100;
    background:linear-gradient(135deg,#011a0a,#021a11,#010d14);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    animation:fadeSlideUp 0.5s ease both;
  }
  .auth-success-icon {
    width:90px; height:90px; border-radius:50%;
    background:linear-gradient(135deg,#10b981,#059669);
    display:flex; align-items:center; justify-content:center;
    margin-bottom:28px;
    animation:successScale 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
    box-shadow:0 0 0 16px rgba(16,185,129,0.08),0 0 60px rgba(16,185,129,0.3);
  }

  /* ── RESPONSIVE ── */
  @media(max-width:768px) {
    .auth-right { display:none; }
    .auth-left { width:100%; padding:32px 24px; }
  }
`;

/* ─── Light Streaks (panel-level local glow accent) ─── */
const LightStreaks: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: '30%', left: '-20%', width: '90%', height: '2px', background: 'linear-gradient(90deg,transparent,rgba(255,120,30,0.5),rgba(255,80,10,0.3),transparent)', animation: 'streakMove1 10s ease-in-out infinite', filter: 'blur(1px)', boxShadow: '0 0 12px rgba(255,100,0,0.3)', borderRadius: '50%' }} />
    <div style={{ position: 'absolute', top: '65%', right: '-15%', width: '75%', height: '1.5px', background: 'linear-gradient(90deg,transparent,rgba(220,50,80,0.45),rgba(255,80,20,0.25),transparent)', animation: 'streakMove2 14s ease-in-out infinite 2s', filter: 'blur(0.8px)', borderRadius: '50%' }} />
  </div>
);

/* ─── AI Assistant Orb ─── */
const AIOrb: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute', bottom: 28, left: 28, width: 52, height: 52,
        borderRadius: '50%', cursor: 'pointer', zIndex: 10,
        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'scale(1.22)' : 'scale(1)',
      }}
    >
      {[0, 1].map(i => (
        <div key={i} style={{
          position: 'absolute', inset: -10 - i * 10, borderRadius: '50%',
          border: '1px solid rgba(139,92,246,0.35)',
          animation: `orbRingExpand ${2.2 + i * 0.9}s ease-out infinite`,
          animationDelay: `${i * 0.7}s`,
        }} />
      ))}
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        border: '1px dashed rgba(168,85,247,0.55)',
        animation: 'aiOrbRotate 6s linear infinite',
      }} />
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, rgba(192,132,252,0.92), rgba(139,92,246,0.75) 50%, rgba(79,70,229,0.55) 100%)',
        animation: 'aiOrbPulse 4s ease-in-out infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(192,132,252,0.45)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill="white" opacity="0.9" />
          <circle cx="12" cy="4" r="2" fill="white" opacity="0.6" />
          <circle cx="12" cy="20" r="2" fill="white" opacity="0.4" />
          <circle cx="4" cy="12" r="2" fill="white" opacity="0.5" />
          <circle cx="20" cy="12" r="2" fill="white" opacity="0.5" />
        </svg>
      </div>
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '115%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,0,40,0.96)', border: '1px solid rgba(139,92,246,0.45)',
          borderRadius: 10, padding: '6px 14px', whiteSpace: 'nowrap',
          fontSize: 11, fontWeight: 700, color: 'rgba(192,132,252,0.95)',
          backdropFilter: 'blur(16px)', letterSpacing: '0.4px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5),0 0 20px rgba(139,92,246,0.25)',
          animation: 'fadeSlideUp 0.2s ease both',
        }}>✦ AI Assistant</div>
      )}
    </div>
  );
};

/* ─── Animated Particles ─── */
const Particles: React.FC = () => {
  const colors = ['#fb923c', '#ec4899', '#6366f1', '#60a5fa', 'rgba(255,255,255,0.75)', '#f59e0b', '#10b981', '#a78bfa'];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 55 }).map((_, i) => {
        const size = 1.5 + Math.random() * 4;
        const color = colors[i % colors.length];
        const isStar = i % 5 === 0;
        const isDiamond = i % 9 === 0;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            bottom: `-${size}px`,
            width: `${size}px`, height: `${size}px`,
            background: (isStar || isDiamond) ? 'transparent' : color,
            boxShadow: `0 0 ${size * 2.5}px ${color}`,
            clipPath: isStar
              ? 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'
              : isDiamond ? 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' : 'none',
            borderRadius: (isStar || isDiamond) ? '0' : '50%',
            opacity: 0.35 + Math.random() * 0.65,
            animation: `particleRise ${7 + Math.random() * 12}s linear infinite`,
            animationDelay: `${Math.random() * 12}s`,
            '--dx': `${(Math.random() - 0.5) * 100}px`,
          } as React.CSSProperties} />
        );
      })}
    </div>
  );
};

/* ─── Count-up stat ─── */
const CountUpStat: React.FC<{ target: string; label: string; color: string; delay: number }> = ({ target, label, color, delay }) => {
  const [val, setVal] = useState('0');
  useEffect(() => {
    const t = setTimeout(() => {
      const num = parseInt(target.replace(/\D/g, ''));
      const suffix = target.replace(/[\d]/g, '');
      let start = 0;
      const step = Math.ceil(num / 40);
      const iv = setInterval(() => {
        start += step;
        if (start >= num) { setVal(target); clearInterval(iv); }
        else setVal(start + suffix);
      }, 30);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return (
    <div className="auth-stat" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ fontSize: 22, fontWeight: 800, background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 2, fontFamily: 'Outfit,sans-serif' }}>{val}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
};

/* ─── Animated Logo (Right Panel) ─── */
const AnimatedLogo: React.FC = () => {
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const loop = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      setTick(ts - startRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const outerAngle = (tick * 0.03) % 360;
  const midAngle = -(tick * 0.05) % 360;
  const innerAngle = (tick * 0.04) % 360;
  const pulse = 0.5 + 0.5 * Math.sin(tick / 800);

  const filmHoles = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const r = 76;
    return { x: 84 + r * Math.cos(a), y: 84 + r * Math.sin(a) };
  });
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return {
      x1: 84 + 28 * Math.cos(a), y1: 84 + 28 * Math.sin(a),
      x2: 84 + 52 * Math.cos(a), y2: 84 + 52 * Math.sin(a),
    };
  });
  const midDots = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    const r = 58;
    return { x: 84 + r * Math.cos(a), y: 84 + r * Math.sin(a) };
  });

  return (
    <div className="auth-logo-reel">
      <div className="auth-reel-halo" style={{ opacity: 0.2 + pulse * 0.4 }} />
      {/* Outer ring */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: `rotate(${outerAngle}deg)` }} viewBox="0 0 168 168">
        <defs>
          <linearGradient id="gradOut" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" /><stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle cx="84" cy="84" r="80" fill="none" stroke="url(#gradOut)" strokeWidth="3" strokeDasharray="8 4" opacity="0.9" />
        {filmHoles.map((h, i) => (
          <rect key={i} x={h.x - 5} y={h.y - 5} width="10" height="10" rx="2" fill="rgba(10,0,20,0.95)" stroke="rgba(251,146,60,0.5)" strokeWidth="1" />
        ))}
      </svg>
      {/* Middle ring */}
      <svg style={{ position: 'absolute', inset: '22px', width: 'calc(100% - 44px)', height: 'calc(100% - 44px)', transform: `rotate(${midAngle}deg)` }} viewBox="0 0 124 124">
        <defs>
          <linearGradient id="gradMid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" /><stop offset="50%" stopColor="#ec4899" /><stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="62" cy="62" r="58" fill="none" stroke="url(#gradMid)" strokeWidth="2" opacity="0.8" />
        {spokes.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="rgba(245,158,11,0.6)" strokeWidth="1.5" />
        ))}
        {midDots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="3.5" fill="rgba(251,146,60,0.8)" />
        ))}
      </svg>
      {/* Inner ring */}
      <svg style={{ position: 'absolute', inset: '44px', width: 'calc(100% - 88px)', height: 'calc(100% - 88px)', transform: `rotate(${innerAngle}deg)` }} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(236,72,153,0.4)" strokeWidth="1.5" strokeDasharray="4 6" />
      </svg>
      {/* Core */}
      <div className="auth-reel-core" style={{ boxShadow: `0 0 ${24 + pulse * 24}px rgba(251,146,60,${0.5 + pulse * 0.3}), 0 0 ${48 + pulse * 48}px rgba(236,72,153,${0.25 + pulse * 0.2}), inset 0 0 ${24 + pulse * 12}px rgba(251,146,60,${0.1 + pulse * 0.1})` }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <polygon points="8,4 18,11 8,18" fill="rgba(255,255,255,0.9)" />
        </svg>
      </div>
      {/* Scan line */}
      <div className="auth-reel-scan" />
      {/* Orbit dots */}
      {[
        { color: '#fb923c', anim: 'orbitA 3s linear infinite', size: 10 },
        { color: '#ec4899', anim: 'orbitB 4.5s linear infinite 1s', size: 8 },
        { color: '#10b981', anim: 'orbitC 2.2s linear infinite 0.5s', size: 7 },
      ].map((o, i) => (
        <div key={i} className="auth-orbit-dot" style={{ width: o.size, height: o.size, marginLeft: -o.size / 2, marginTop: -o.size / 2, background: o.color, boxShadow: `0 0 ${o.size * 2}px ${o.color}`, animation: o.anim }} />
      ))}
    </div>
  );
};

/* ─── Main Component ─── */
export default function AuthPage() {
  const { login, register, navigate, logout } = useApp();

  // Lazy cache loader
  const getInitialParams = () => {
    try {
      const stored = localStorage.getItem('cc_auth_form_backup');
      if (stored) return JSON.parse(stored);
    } catch { /* suppress */ }
    return { panel: 'user', mode: 'login', regStep: 1, step1Data: null, theatreStep2Data: null, email: '' };
  };
  const [initCache] = useState(getInitialParams);

  const [panel, setPanel] = useState<AuthPanel>(initCache.panel);
  const [mode, setMode] = useState<AuthMode>(initCache.mode);
  const [regStep, setRegStep] = useState<1 | 2 | 3>(initCache.regStep);
  const [step1Data, setStep1Data] = useState<{ name: string; phone: string; email: string; password: string } | null>(initCache.step1Data);
  const [theatreStep2Data, setTheatreStep2Data] = useState<{
    avatar?: string; theatreName: string; theatreLocation: string; theatreCity: string;
    aadhaarNumber: string; aadhaarFront?: string; aadhaarBack?: string;
  } | null>(initCache.theatreStep2Data);

  const [theatreRegSuccess, setTheatreRegSuccess] = useState(false);
  const [theatrePendingFromLogin, setTheatrePendingFromLogin] = useState(false);
  // login fields
  const [email, setEmail] = useState(initCache.email);
  const [password, setPassword] = useState('');

  useEffect(() => {
    localStorage.setItem('cc_auth_form_backup', JSON.stringify({
       panel, mode, regStep, step1Data, theatreStep2Data, email
    }));
  }, [panel, mode, regStep, step1Data, theatreStep2Data, email]);
  const [adminCode, setAdminCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const accentColor = panel === 'user' ? '#fb923c' : panel === 'theatre_owner' ? '#f59e0b' : '#ef4444';

  // ── User Registration wizard handlers ──────────────────────────────────────
  const handleStep1Next = (data: { name: string; phone: string; email: string; password: string }) => {
    setStep1Data(data);
    setRegStep(2);
  };

  const handleStep2Complete = async (profile: {
    avatar?: string;
    avatarFile?: File;
    username: string;
    gender: 'Male' | 'Female' | 'Other';
    bio: string;
    movieInterests: string[];
  }) => {
    if (!step1Data) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const ok = await register(
      step1Data.name, step1Data.email, step1Data.password, step1Data.phone,
      'user',
      { avatar: profile.avatar, username: profile.username, gender: profile.gender, bio: profile.bio, movieInterests: profile.movieInterests, acceptedTerms }
    );
    // If registration succeeded and user provided a photo, upload it to MongoDB now
    // (token is set by register(), so apiUploadAvatar will authenticate correctly)
    if (ok && profile.avatarFile) {
      try {
        const { apiUploadAvatar } = await import('../services/apiService');
        await apiUploadAvatar(profile.avatarFile);
      } catch { /* non-critical — base64 already saved in register payload */ }
    }
    setLoading(false);
    if (ok) setSuccess(true);
    else setErrors({ email: 'Registration failed. Email may already be in use.' });
  };

  // ── Theatre Owner 3-step wizard handlers ───────────────────────────────────
  const handleTheatreStep1Next = (data: { name: string; phone: string; email: string; password: string }) => {
    setStep1Data(data);
    setRegStep(2);
  };

  const handleTheatreStep2Next = (data: {
    avatar?: string; theatreName: string; theatreLocation: string; theatreCity: string;
    aadhaarNumber: string; aadhaarFront?: string; aadhaarBack?: string;
  }) => {
    setTheatreStep2Data(data);
    setRegStep(3);
  };

  const handleTheatreStep3Complete = async (bankData: {
    bankAccountHolder: string; bankName: string; bankAccountNumber: string; bankIfsc: string;
  }) => {
    if (!step1Data || !theatreStep2Data) return;
    setLoading(true);
    try {
      const res = await apiTheatreOwnerRegister({
        ...step1Data,
        ...theatreStep2Data,
        ...bankData,
      });
      setLoading(false);
      if (res.ok && res.data?.success) {
        // ALWAYS show the pending-approval success screen after registration.
        // Admin must approve before the owner can log in.
        setTheatreRegSuccess(true);
      } else {
        setErrors({ email: res.data?.message || 'Registration failed. Please try again.' });
      }
    } catch {
      setLoading(false);
      setErrors({ email: 'Something went wrong. Please try again.' });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (panel === 'admin') {
      if (!email) e.email = 'Email required';
      if (!password) e.password = 'Password required';
      if (!adminCode) e.adminCode = 'Admin access code required';
      else if (adminCode !== 'CINE_ADMIN_2024') e.adminCode = 'Invalid admin access code';
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
      if (password.length < 6) e.password = 'Password must be at least 6 characters';
      if (!acceptedTerms) e.terms = 'Please accept Terms & Conditions to continue.';
    }
    return e;
  };

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++rippleId.current;
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(rr => rr.id !== id)), 650);
  }, []);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    handleRipple(e);

    // Admin: clear old session and go to the dedicated admin login page
    if (panel === 'admin') {
      localStorage.removeItem('cc_admin_session');
      navigate('admin-login');
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs); setShake(true);
      setTimeout(() => setShake(false), 600); return;
    }
    setErrors({}); setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const ok = await login(email, password, acceptedTerms);
    setLoading(false);

    if (!ok) {
      setErrors({ email: 'Invalid credentials. Please check your email and password.' });
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    // — Role guard: ensure the user's actual role matches the panel they logged into —
    // Read the stored user from localStorage (login() just wrote it)
    const stored = localStorage.getItem('cc_user');
    const loggedUser = stored ? JSON.parse(stored) : null;
    const actualRole: string = loggedUser?.role ?? '';

    const expectedRole = panel === 'theatre_owner' ? 'theatre_owner' : 'user';

    if (actualRole !== expectedRole) {
      // Role mismatch — silently log out and show a clear error
      const { apiLogout } = await import('../services/apiService');
      apiLogout();
      logout();
      const label = panel === 'theatre_owner' ? 'Theatre Owner' : 'User';
      setErrors({ email: `This account is not a ${label} account. Please select the correct login section.` });
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    // — Pending approval check for theatre owners —
    if (actualRole === 'theatre_owner') {
      const approvalStatus: string = loggedUser?.approvalStatus ?? 'pending';
      if (approvalStatus !== 'approved') {
        // Show the pending screen: flag as coming from login (not fresh reg)
        setTheatrePendingFromLogin(true);
        setTheatreRegSuccess(true);
        // undo the navigation that AppContext.login() already triggered
        navigate('auth');
        return;
      }
    }

    setSuccess(true);
  };

  const featureCards = [
    { icon: '🎬', title: 'Premium Movies', sub: '10k+ titles', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
    { icon: '🎭', title: 'Live Shows', sub: '500+ theatres', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    { icon: '🪑', title: 'Smart Seats', sub: 'Instant lock', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    { icon: '⚡', title: 'Quick Booking', sub: '3 easy steps', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  ];

  const rolePills = [
    { label: 'User', color: '#fb923c', active: panel === 'user' },
    { label: 'Theatre', color: '#f59e0b', active: panel === 'theatre_owner' },
    { label: 'Admin', color: '#ef4444', active: panel === 'admin' },
  ];

  if (success) return (
    <>
      <style>{STYLES}</style>
      <div className="auth-success">
        <div className="auth-success-icon">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M8 22L18 32L36 14" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" strokeDashoffset="80" style={{ animation: 'tickDraw 0.8s ease 0.2s both forwards' }} />
          </svg>
        </div>
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>
          {mode === 'register' ? 'Welcome to CineConnect!' : 'Welcome Back!'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Taking you to your dashboard…</p>
        <div style={{ marginTop: 24, width: 200, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#34d399)', borderRadius: 99, animation: 'shimmer 1.5s ease infinite', width: '100%' }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-root">
        <div className="auth-bg-gradient" />
        {/* Global cinematic arc streaks */}
        <div className="auth-arc-layer">
          <div className="auth-arc1" />
          <div className="auth-arc2" />
          <div className="auth-arc3" />
          <div className="auth-streak-h1" />
          <div className="auth-streak-h2" />
          <div className="auth-streak-h3" />
        </div>
        {/* ─── LEFT PANEL ─── */}
        <div className="auth-left">
          <div className="auth-left-bg1" />
          <div className="auth-left-blob1" />
          <div className="auth-left-blob2" />
          <div className="auth-left-grid" />
          <div className="auth-left-beam1" />
          <div className="auth-left-beam2" />
          <div className="auth-left-accent" />
          <div className="auth-left-accent-b" />
          <Particles />
          <LightStreaks />
          <AIOrb />

          <div className="auth-card" style={{ animation: shake ? 'shake 0.5s ease both' : undefined }}>
            {/* Welcome Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <div className="auth-badge">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: accentColor, display: 'inline-block', boxShadow: `0 0 8px ${accentColor}`, animation: 'badgePulse 2s ease-in-out infinite' }} />
                {panel === 'admin' ? '⚡ Admin Control Center' : panel === 'theatre_owner' ? '🏛️ Theatre Portal' : '🎬 Welcome to CineConnect'}
              </div>
            </div>

            {/* Role Segmented Control */}
            <div className="auth-role-segment">
              {(['user', 'theatre_owner'] as const).map(r => (
                <button key={r} className={`auth-role-seg-btn ${panel === r ? (r === 'user' ? 'seg-active-user' : 'seg-active-theatre') : ''}`} onClick={() => { setPanel(r); setErrors({}); }}>
                  <div className="auth-role-seg-icon">
                    {r === 'user' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="7" r="5" /><path d="M3 21c0-4.4 3.6-8 9-8s9 3.6 9 8" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    )}
                  </div>
                  {r === 'user' ? 'User' : 'Theatre'}
                </button>
              ))}
            </div>

            {/* Mode Tabs (not for admin) */}
            {panel !== 'admin' && (
              <div className="auth-mode-tabs">
                {(['login', 'register'] as const).map(m => (
                  <button key={m} className={`auth-mode-tab ${mode === m ? 'active' : ''}`} onClick={() => { setMode(m); setErrors({}); setRegStep(1); setStep1Data(null); }}>
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>
            )}



            {/* ── REGISTER WIZARD ── renders wizard instead of inline form ── */}
            {panel === 'user' && mode === 'register' && (
              <div style={{ marginTop: -8 }}>
                {regStep === 1 && (
                  <RegStep1
                    onNext={handleStep1Next}
                    onBack={() => { setMode('login'); setRegStep(1); setStep1Data(null); setErrors({}); }}
                  />
                )}
                {regStep === 2 && step1Data && (
                  <RegStep2
                    step1Data={step1Data}
                    onComplete={handleStep2Complete}
                    onBack={() => setRegStep(1)}
                    loading={loading}
                  />
                )}
                {errors.email && <div className="auth-error" style={{ marginTop: 8 }}>⚠ {errors.email}</div>}
              </div>
            )}

            {/* ── THEATRE OWNER 3-STEP WIZARD ── */}
            {panel === 'theatre_owner' && mode === 'register' && !theatreRegSuccess && (
              <div style={{ marginTop: -8 }}>
                {regStep === 1 && (
                  <TheatreRegStep1
                    onNext={handleTheatreStep1Next}
                    onBack={() => { setMode('login'); setRegStep(1); setStep1Data(null); setTheatreStep2Data(null); setErrors({}); }}
                  />
                )}
                {regStep === 2 && step1Data && (
                  <TheatreRegStep2
                    step1Data={step1Data}
                    onNext={handleTheatreStep2Next}
                    onBack={() => setRegStep(1)}
                  />
                )}
                {regStep === 3 && step1Data && theatreStep2Data && (
                  <TheatreRegStep3
                    step1Data={step1Data}
                    step2Data={theatreStep2Data}
                    onComplete={handleTheatreStep3Complete}
                    onBack={() => setRegStep(2)}
                    loading={loading}
                  />
                )}
                {errors.email && <div className="auth-error" style={{ marginTop: 8 }}>⚠ {errors.email}</div>}
              </div>
            )}

            {/* ── THEATRE OWNER — Under Verification Screen ── */}
            {panel === 'theatre_owner' && theatreRegSuccess && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,146,60,0.1))', border: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'badgePulse 2s ease-in-out infinite' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10" stroke="#10b981" strokeWidth="2.5"/></svg>
                </div>
                <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#fff 30%,#f59e0b 70%,#fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
                  {theatrePendingFromLogin ? 'Approval Pending' : 'Registration Submitted!'}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
                  {theatrePendingFromLogin
                    ? <>Your account is <span style={{ color: '#f59e0b', fontWeight: 700 }}>waiting for admin approval</span>. You'll be able to access your theatre dashboard once an admin approves your account. Please check back later.</>
                    : <>Your theatre owner account is <span style={{ color: '#f59e0b', fontWeight: 700 }}>under verification</span>. Our admin team will review your details and approve your account within 24-48 hours.</>
                  }
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280, margin: '0 auto' }}>
                  {(theatrePendingFromLogin
                    ? [
                        { icon: '✅', text: 'Account created', done: true },
                        { icon: '✅', text: 'Documents submitted', done: true },
                        { icon: '⏳', text: 'Admin approval pending', done: false },
                        { icon: '🔒', text: 'Dashboard locked until approved', done: false },
                      ]
                    : [
                        { icon: '✅', text: 'Basic details verified', done: true },
                        { icon: '✅', text: 'Aadhaar uploaded', done: true },
                        { icon: '✅', text: 'Bank details saved', done: true },
                        { icon: '⏳', text: 'Admin approval pending', done: false },
                      ]
                  ).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: s.done ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${s.done ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`, borderRadius: 10 }}>
                      <span style={{ fontSize: 14 }}>{s.icon}</span>
                      <span style={{ fontSize: 12, color: s.done ? 'rgba(16,185,129,0.8)' : '#f59e0b', fontWeight: 600 }}>{s.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setTheatreRegSuccess(false); setTheatrePendingFromLogin(false); setMode('login'); setRegStep(1); setStep1Data(null); setTheatreStep2Data(null); }}
                  style={{ marginTop: 24, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, color: '#f59e0b', fontSize: 13, fontWeight: 700, padding: '10px 28px', cursor: 'pointer', transition: 'all 0.2s' }}
                >← Back to Sign In</button>
              </div>
            )}

            {/* ── LOGIN FIELDS (only shown in login mode, NOT admin) ── */}
            {mode === 'login' && panel !== 'admin' && (
              <>

                {/* Email */}
                <div className="auth-field">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-left-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input className={`auth-input ${errors.email ? 'error' : ''}`} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  {errors.email && <div className="auth-error">⚠ {errors.email}</div>}
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-left-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <input className={`auth-input ${errors.password ? 'error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 46 }} />
                    <button className="auth-input-icon" type="button" onClick={() => setShowPw(p => !p)}>
                      {showPw ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                    </button>
                  </div>
                  {errors.password && <div className="auth-error">⚠ {errors.password}</div>}
                  <div style={{ textAlign: 'right', marginTop: '6px' }}>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('forgot-password'); }} style={{ background: 'none', border: 'none', color: accentColor, fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', opacity: 0.8, textDecoration: 'underline' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Admin code */}
                {panel === 'admin' && (
                  <div className="auth-field">
                    <label className="auth-label" style={{ color: 'rgba(239,68,68,0.7)' }}>Admin Access Code</label>
                    <div className="auth-input-wrap">
                      <input className={`auth-input ${errors.adminCode ? 'error' : ''}`} type={showAdminPw ? 'text' : 'password'} placeholder="CINE_ADMIN_XXXX" value={adminCode} onChange={e => setAdminCode(e.target.value)} style={{ paddingRight: 46, borderColor: 'rgba(239,68,68,0.3)' }} />
                      <button className="auth-input-icon" type="button" onClick={() => setShowAdminPw(p => !p)}>
                        {showAdminPw ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                      </button>
                    </div>
                    {errors.adminCode && <div className="auth-error">⚠ {errors.adminCode}</div>}
                  </div>
                )}
              </>
            )}

            {/* Admin panel — simplified, just shows a CTA to go to dedicated admin login */}
            {panel === 'admin' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🔐</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Admin Control Center</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>Secure admin login with backend authentication</div>
                </div>
              </div>
            )}

            {/* Terms and Conditions Consent Box */}
            {panel !== 'admin' && (mode === 'login' || mode === 'register') && (
              <div style={{ marginBottom: 20, marginTop: mode === 'register' ? 8 : 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${errors.terms ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, transition: 'all 0.3s', position: 'relative', zIndex: 10 }}>
                  <input 
                    type="checkbox" 
                    checked={acceptedTerms} 
                    onChange={e => { setAcceptedTerms(e.target.checked); setErrors(p => ({ ...p, terms: '' })); }}
                    style={{ width: 20, height: 20, accentColor: '#ec4899', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                      I agree to Cine Connect{' '}
                      <span onClick={e => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#fb923c', fontWeight: 600, textDecoration: 'underline', transition: '0.2s', position: 'relative', zIndex: 2 }}>Terms &amp; Conditions</span>,{' '}
                      <span onClick={e => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#fb923c', fontWeight: 600, textDecoration: 'underline', transition: '0.2s', position: 'relative', zIndex: 2 }}>Privacy Policy</span>, and{' '}
                      <span onClick={e => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} style={{ color: '#fb923c', fontWeight: 600, textDecoration: 'underline', transition: '0.2s', position: 'relative', zIndex: 2 }}>User Guidelines</span>.
                    </span>
                  </div>
                </label>
                {errors.terms && <div className="auth-error" style={{ justifyContent: 'center', marginTop: 8 }}>⚠ {errors.terms}</div>}
              </div>
            )}

            {/* Submit — only in login / admin mode; wizard has its own buttons */}
            {(mode === 'login' || panel === 'admin') && (
              <button className={`auth-submit ${panel === 'admin' ? 'auth-submit-admin' : ''}`} onClick={handleSubmit} disabled={loading}>
                <div className="auth-submit-shine" />
                <div className="auth-submit-top" />
                {ripples.map(rp => <span key={rp.id} className="auth-submit-ripple" style={{ left: rp.x - 5, top: rp.y - 5 }} />)}
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spinSlow 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                    {panel === 'admin' ? 'Verifying credentials…' : 'Authenticating…'}
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {panel === 'admin' ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" /></svg> Enter Admin Panel</>
                    ) : mode === 'login' ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg> Sign In</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> Create Account</>
                    )}
                  </span>
                )}
              </button>
            )}

            {/* Toggle — only in login mode */}
            {panel !== 'admin' && mode === 'login' && (
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setErrors({}); setRegStep(1); setStep1Data(null); }} style={{ background: 'none', border: 'none', color: accentColor, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  Create Account
                </button>
              </div>
            )}

            {/* Secure text — only in login/admin mode */}
            {(mode === 'login' || panel === 'admin') && (
              <div className="auth-secure">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                256-bit SSL encrypted · Your data is safe
              </div>
            )}

            {/* ── COMPACT ADMIN PILL — bottom of card ── */}
            <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', justifyContent: 'center' }}>
              <div
                className={`auth-admin-pill ${panel === 'admin' ? 'pill-active' : ''}`}
                onClick={() => { setPanel('admin'); setErrors({}); }}
              >
                <div className="auth-admin-pill-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(239,68,68,0.25)" stroke="#ef4444" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="auth-admin-pill-label">Admin</span>
                <span className="auth-admin-pill-dot" />
                <span className="auth-admin-pill-chevron">›</span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="auth-right">
          <div className="auth-right-bg" />
          <div className="auth-right-blob" />
          <div className="auth-right-grid" />
          <div className="auth-right-glow" />
          <div className="auth-right-glow2" />
          <div className="auth-right-beam" />
          <Particles />
          <LightStreaks />

          {/* Logo */}
          <div className="auth-logo-wrap">
            <AnimatedLogo />
            <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 42, fontWeight: 900, textAlign: 'center', marginBottom: 6, background: 'linear-gradient(135deg,#fde68a 0%,#fb923c 40%,#f97316 70%,#dc2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px', position: 'relative', zIndex: 2, lineHeight: 1.1 }}>
              CineConnect
            </h1>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 600, textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 8 }}>
              Premium Cinema Experience
            </div>
            <div style={{ width: 120, height: 2, background: 'linear-gradient(90deg,transparent,#fb923c,#f97316,transparent)', borderRadius: 99, margin: '0 auto', boxShadow: '0 0 12px rgba(251,146,60,0.5)' }} />
          </div>

          {/* Feature Cards */}
          <div className="auth-cards-grid">
            {featureCards.map((f, i) => (
              <div key={i} className="auth-feat-card" style={{ animationDelay: `${i * 100}ms`, '--card-color': f.color, '--card-glow': `0 0 25px ${f.color}25` } as React.CSSProperties}>
                {/* Top color bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${f.color},transparent)`, borderRadius: '16px 16px 0 0', opacity: 0.8 }} />
                {/* Icon */}
                <div className="auth-feat-icon" style={{ fontSize: 20, width: 40, height: 40, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 14px ${f.color}25` }}>{f.icon}</div>
                {/* Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>{f.title}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{f.sub}</div>
                </div>
                <div className="auth-feat-glow-bar" />
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="auth-stats">
            <CountUpStat target="10K+" label="Movies" color="linear-gradient(135deg,#fbbf24,#fb923c)" delay={200} />
            <CountUpStat target="500+" label="Theatres" color="linear-gradient(135deg,#fb923c,#f97316)" delay={350} />
            <CountUpStat target="2M+" label="Users" color="linear-gradient(135deg,#f97316,#dc2626)" delay={500} />
          </div>

          {/* Role pills */}
          <div className="auth-role-pills">
            {rolePills.map((p, i) => (
              <div key={i} className="auth-role-pill" style={{
                borderColor: p.active ? p.color : 'rgba(255,255,255,0.08)',
                color: p.active ? p.color : 'rgba(255,255,255,0.3)',
                background: p.active ? `rgba(${p.color === '#fb923c' ? '251,146,60' : p.color === '#f59e0b' ? '245,158,11' : '239,68,68'},0.1)` : 'transparent',
                boxShadow: p.active ? `0 0 14px ${p.color}40` : 'none',
                transform: p.active ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.34,1.4,0.64,1)',
              }}>
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {showTermsModal && (
        <TermsModal 
          onClose={() => setShowTermsModal(false)}
          onAccept={() => {
            setAcceptedTerms(true);
            setShowTermsModal(false);
            setErrors(p => ({ ...p, terms: '' }));
          }}
        />
      )}
    </>
  );
}
