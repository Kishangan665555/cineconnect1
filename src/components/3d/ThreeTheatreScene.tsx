import React, { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls, Instances, Instance, Environment, SpotLight, useTexture, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

// ─── CONFIGURATION & SCALING ───
const defaultConfig = {
  totalRows: 12,
  seatsPerRow: 16,
  rowSpacing: 1.8,
  seatSpacing: 0.9,
  stairs: true,
  balconyRowStart: 8,
  screenWidth: 28, 
  screenHeight: 12,
  theatreWidth: 35,
  theatreLength: 40,
};

// ─── KEYBOARD HOOK FOR WALK MODE ───
const useKeyboardControls = () => {
  const [keys, setKeys] = useState({ forward: false, backward: false, left: false, right: false, run: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setKeys(k => ({ ...k, forward: true })); break;
        case 'KeyA': case 'ArrowLeft': setKeys(k => ({ ...k, left: true })); break;
        case 'KeyS': case 'ArrowDown': setKeys(k => ({ ...k, backward: true })); break;
        case 'KeyD': case 'ArrowRight': setKeys(k => ({ ...k, right: true })); break;
        case 'ShiftLeft': case 'ShiftRight': setKeys(k => ({ ...k, run: true })); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setKeys(k => ({ ...k, forward: false })); break;
        case 'KeyA': case 'ArrowLeft': setKeys(k => ({ ...k, left: false })); break;
        case 'KeyS': case 'ArrowDown': setKeys(k => ({ ...k, backward: false })); break;
        case 'KeyD': case 'ArrowRight': setKeys(k => ({ ...k, right: false })); break;
        case 'ShiftLeft': case 'ShiftRight': setKeys(k => ({ ...k, run: false })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
};

// ─── PROCEDURAL SEAT MODEL ───
const buildTheatreMap = (config: any) => {
  const seats: any[] = [];
  const startX = -((config.seatsPerRow - 1) * config.seatSpacing) / 2;
  const startZ = 12; // Start distance from screen
  
  const idealZ = startZ + (config.totalRows * config.rowSpacing) * 0.4;
  
  for (let r = 0; r < config.totalRows; r++) {
    for (let c = 0; c < config.seatsPerRow; c++) {
      const isRightHalf = c >= config.seatsPerRow / 2;
      const aisleOffset = isRightHalf ? 2.0 : 0;
      
      const x = startX + (c * config.seatSpacing) + aisleOffset;
      const z = startZ + (r * config.rowSpacing);
      
      let y = config.stairs ? r * 0.4 : 0;
      if (r >= config.balconyRowStart) y += 1.8;
      
      const distToIdealZ = Math.abs(z - idealZ);
      const horizontalPenalty = Math.abs(x) * 0.4;
      const depthPenalty = distToIdealZ * 0.3;
      
      let qualityScore = 10 - (horizontalPenalty + depthPenalty);
      qualityScore = Math.max(0, Math.min(10, qualityScore));
      
      // We simulate random bookings exactly like the theatre owner data for visual effect
      // In a real flow, this would come from the API payload of booked seats
      const isBooked = Math.random() > 0.85; 

      seats.push({
        id: `Seat_R${r}_C${c}`, 
        rowNum: r, colNum: c, 
        x, y, z, 
        qualityScore,
        isBooked,
      });
    }
  }
  return seats;
};

// ─── SCREEN CONTENT RENDERER ───
const ScreenContent = ({ mediaUrl, mediaType, config }: { mediaUrl?: string, mediaType?: 'image' | 'video', config: any }) => {
   if (!mediaUrl) {
      return (
         <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      );
   }

   if (mediaType === 'video') {
      const VideoMaterial = () => {
         const texture = useVideoTexture(mediaUrl, { muted: true, loop: true, start: true });
         return <meshBasicMaterial map={texture} toneMapped={false} />;
      };
      return <VideoMaterial />;
   }

   if (mediaType === 'image') {
      const ImageMaterial = () => {
         const texture = useTexture(mediaUrl);
         texture.colorSpace = THREE.SRGBColorSpace;
         return <meshBasicMaterial map={texture} toneMapped={false} />;
      };
      return <ImageMaterial />;
   }

   return <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />;
};

// ─── MASTER CAMERA / MOVEMENT CONTROLLER ───
const CameraController = ({ 
  mode, 
  targetSeat, 
  screenCenter,
  config,
  onUnlock 
}: { 
  mode: 'free' | 'seat' | 'walk-locked' | 'walk-ready', 
  targetSeat: any, 
  screenCenter: THREE.Vector3,
  config: any,
  onUnlock: () => void
}) => {
  const { camera } = useThree();
  const orbitRef = useRef<any>(null);
  const pointerLockRef = useRef<any>(null);
  const keys = useKeyboardControls();
  
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const playerHeight = 1.6; 
  const prevMode = useRef(mode);

  useEffect(() => {
     camera.position.set(0, config.totalRows * 0.8 + 5, config.theatreLength - 2);
     camera.lookAt(screenCenter.x, screenCenter.y, screenCenter.z);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, delta) => {
    if (mode === 'free' || mode === 'walk-ready') {
      if (orbitRef.current) orbitRef.current.enabled = true;
      if (pointerLockRef.current && pointerLockRef.current.isLocked) pointerLockRef.current.unlock();
      
      // @ts-ignore
      camera.fov = THREE.MathUtils.lerp(camera.fov, 65, 4 * delta);
      camera.updateProjectionMatrix();
      prevMode.current = mode;
      return;
    }

    if (mode === 'seat' && targetSeat) {
      if (orbitRef.current) orbitRef.current.enabled = false;
      if (pointerLockRef.current && pointerLockRef.current.isLocked) pointerLockRef.current.unlock();
      
      const targetPos = new THREE.Vector3(targetSeat.x + 0.15, targetSeat.y + 1.2, targetSeat.z + 0.2);
      camera.position.lerp(targetPos, 5 * delta);
      
      const currentLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const targetLookAt = screenCenter.clone().sub(camera.position).normalize();
      currentLookAt.lerp(targetLookAt, 5 * delta);
      
      const targetRotation = new THREE.Matrix4().lookAt(camera.position, camera.position.clone().add(currentLookAt), camera.up);
      camera.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(targetRotation), 5 * delta);
      
      const dist = camera.position.distanceTo(screenCenter);
      const targetFov = THREE.MathUtils.clamp(85 - (dist * 1.5), 35, 80);
      
      // @ts-ignore
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 5 * delta);
      camera.updateProjectionMatrix();

      prevMode.current = mode;
      return;
    }

    if (mode === 'walk-locked') {
      if (orbitRef.current) orbitRef.current.enabled = false;
      
      const speed = keys.run ? 15.0 : 8.0;
      const friction = 10.0;
      
      velocity.current.x -= velocity.current.x * friction * delta;
      velocity.current.z -= velocity.current.z * friction * delta;

      direction.current.z = Number(keys.forward) - Number(keys.backward);
      direction.current.x = Number(keys.right) - Number(keys.left);
      direction.current.normalize();

      if (keys.forward || keys.backward) velocity.current.z -= direction.current.z * speed * delta;
      if (keys.left || keys.right) velocity.current.x -= direction.current.x * speed * delta;

      if (pointerLockRef.current && pointerLockRef.current.isLocked) {
         pointerLockRef.current.moveRight(-velocity.current.x * delta);
         pointerLockRef.current.moveForward(-velocity.current.z * delta);
      }

      let targetY = playerHeight;
      const currentZ = camera.position.z;
      if (currentZ > 12 && config.stairs) {
         const rowEstimate = Math.max(0, Math.floor((currentZ - 12) / config.rowSpacing));
         targetY = playerHeight + (rowEstimate * 0.4);
         if (rowEstimate >= config.balconyRowStart) targetY += 1.8;
      }
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 15 * delta);

      const wallLimitX = config.theatreWidth / 2 - 1.5;
      const wallLimitZBack = config.theatreLength - 1.5;
      const wallLimitZFront = 3.0;

      if (camera.position.x > wallLimitX) camera.position.x = wallLimitX;
      if (camera.position.x < -wallLimitX) camera.position.x = -wallLimitX;
      if (camera.position.z > wallLimitZBack) camera.position.z = wallLimitZBack;
      if (camera.position.z < wallLimitZFront) camera.position.z = wallLimitZFront;

      // @ts-ignore
      camera.fov = THREE.MathUtils.lerp(camera.fov, 70, 4 * delta); 
      camera.updateProjectionMatrix();

      prevMode.current = mode;
    }
  });

  return (
    <>
      <OrbitControls 
        ref={orbitRef} 
        makeDefault={(mode === 'free' || mode === 'walk-ready')}
        maxPolarAngle={Math.PI / 2 - 0.05} 
        minDistance={2} maxDistance={60} 
        target={screenCenter} 
      />
      <PointerLockControls 
         ref={pointerLockRef} 
         onUnlock={() => onUnlock()}
      />
    </>
  );
};

// ─── THEATRE ARCHITECTURE ───
const TheatreEnvironment = ({ config }: { config: any }) => {
   const halfWidth = config.theatreWidth / 2;
   const length = config.theatreLength;
   const height = 18;

   return (
      <group>
         <fog attach="fog" args={['#09090b', 10, length + 20]} />
         
         {/* Massive brightness increase for realistic seating visibility */}
         <ambientLight intensity={1.5} color="#f8fafc" />
         <directionalLight position={[0, length, length/2]} intensity={1.5} color="#e2e8f0" />
         
         <SpotLight
            position={[0, height - 2, length - 2]}
            target-position={[0, config.screenHeight / 2 + 1, 0]}
            angle={0.8}
            penumbra={0.7}
            intensity={2}
            castShadow
            color="#38bdf8"
            distance={80}
         />

         {/* Floor */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, length / 2]} receiveShadow>
           <planeGeometry args={[config.theatreWidth + 5, length + 15]} />
           <meshStandardMaterial color="#1e293b" roughness={0.9} />
         </mesh>

         {/* Screen Stage Base */}
         <mesh position={[0, 0.4, 3]} receiveShadow>
            <boxGeometry args={[config.screenWidth + 4, 1.2, 6]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
         </mesh>

         {/* Walls */}
         <mesh position={[-halfWidth, height/2, length/2]} rotation={[0, Math.PI/2, 0]} receiveShadow>
            <planeGeometry args={[length + 15, height]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
         </mesh>
         <mesh position={[halfWidth, height/2, length/2]} rotation={[0, -Math.PI/2, 0]} receiveShadow>
            <planeGeometry args={[length + 15, height]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
         </mesh>
         <mesh position={[0, height/2, length]} rotation={[0, Math.PI, 0]} receiveShadow>
            <planeGeometry args={[config.theatreWidth, height]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
         </mesh>
         <mesh position={[0, height, length/2]} rotation={[Math.PI/2, 0, 0]}>
            <planeGeometry args={[config.theatreWidth, length + 15]} />
            <meshBasicMaterial color="#020617" />
         </mesh>
      </group>
   );
};

// ─── MAIN SCENE EXPERENCE ───
export const ThreeTheatreScene = ({ 
   configArg, 
   mediaUrl, 
   mediaType,
   selectedRow,
   selectedCol,
   onSeatChange
}: { 
   configArg?: any, 
   mediaUrl?: string, 
   mediaType?: 'video' | 'image',
   selectedRow?: number,
   selectedCol?: number,
   onSeatChange?: (row: number, col: number) => void
}) => {
  const [config] = useState({ ...defaultConfig, ...configArg });
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  
  const [viewMode, setViewMode] = useState<'free' | 'seat' | 'walk-ready' | 'walk-locked'>('free');
  const [showQuality, setShowQuality] = useState(false);

  useEffect(() => {
    setSeats(buildTheatreMap(config));
  }, [config]);

  // Sync initial passed row/col to our internal seat tracker
  useEffect(() => {
     if (selectedRow !== undefined && selectedCol !== undefined && seats.length > 0) {
        const found = seats.find(s => s.rowNum === selectedRow && s.colNum === selectedCol);
        if (found) setSelectedSeat(found);
     }
  }, [selectedRow, selectedCol, seats]);

  const screenCenter = useMemo(() => new THREE.Vector3(0, config.screenHeight / 2 + 1.5, 0), [config]);

  const handleUnlock = () => {
      if (viewMode === 'walk-locked') setViewMode('free');
  };

  return (
    <div className="w-full h-full relative bg-slate-900 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] font-sans border border-slate-700">
      
      {/* ── UI CONTROL PANEL ── */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 transition-opacity duration-300">
        <h2 className="text-white text-3xl font-extrabold tracking-tight drop-shadow-xl">Cinema Explorer</h2>
        
        <div className="flex gap-3 bg-slate-900/60 p-2 rounded-xl backdrop-blur-md border border-white/10 w-max shadow-lg">
           <button
             onClick={() => setViewMode('free')}
             className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                viewMode === 'free' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400' : 'text-slate-300 hover:bg-slate-700'
             }`}
           >
             Orbit 360°
           </button>
           
           <button
             onClick={() => {
                if (viewMode !== 'walk-locked') setViewMode('walk-ready');
             }}
             className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm flex items-center gap-2 ${
                viewMode.includes('walk') ? 'bg-emerald-600 text-white shadow-lg border border-emerald-400' : 'text-slate-300 hover:bg-slate-700'
             }`}
           >
             Enter Walk Mode
           </button>

           <button
             onClick={() => {
                if (selectedSeat) setViewMode(viewMode === 'seat' ? 'free' : 'seat');
             }}
             disabled={!selectedSeat}
             className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
               viewMode === 'seat' 
                  ? 'bg-rose-500 text-white shadow-lg border border-rose-400' 
                  : !selectedSeat ? 'text-slate-600 cursor-not-allowed border border-transparent' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg border border-sky-400'
             }`}
           >
             {viewMode === 'seat' ? 'Exit Seat View' : 'View From Selected Seat'}
           </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowQuality(!showQuality)}
            className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-300 border ${
              showQuality 
                ? 'bg-amber-500 text-white border-amber-300 shadow-lg' 
                : 'bg-slate-800 text-white hover:bg-slate-700 border-slate-600 shadow-md'
            }`}
          >
            {showQuality ? 'Hide Seat Ratings' : 'Show Premium Seats'}
          </button>
        </div>
        
        {selectedSeat && (
          <div className="mt-2 bg-slate-900/80 backdrop-blur-xl p-5 rounded-xl border border-slate-600 text-slate-200 w-72 shadow-2xl">
             <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-3">
                 <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Target Seat</span>
                 <strong className="text-xl text-white font-black drop-shadow-md">
                    Row {String.fromCharCode(65 + selectedSeat.rowNum)}-{selectedSeat.colNum + 1}
                 </strong>
             </div>
             
             <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-400">Distance from Screen</span>
                     <span className="text-slate-200 font-medium">{selectedSeat.z.toFixed(1)} m</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-400">Immersion Rating</span>
                     <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        selectedSeat.qualityScore > 8 ? 'bg-emerald-500/20 text-emerald-400' : 
                        selectedSeat.qualityScore > 6 ? 'bg-amber-500/20 text-amber-400' : 
                        'bg-rose-500/20 text-rose-400'
                     }`}>
                        {selectedSeat.qualityScore.toFixed(1)} / 10
                     </div>
                 </div>
             </div>
          </div>
        )}
      </div>

      {/* ── WALK UX OVERLAY ── */}
      {viewMode === 'walk-ready' && (
         <div 
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setViewMode('walk-locked')}
         >
            <div className="text-center translate-y-[-20px]">
               <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
               </div>
               <h3 className="text-white text-3xl font-bold mb-2 tracking-tight">Click to Start Walking</h3>
               <p className="text-slate-300 text-lg">Use <strong className="text-white">W A S D</strong> to move around.</p>
               <p className="text-slate-400 text-sm mt-4 tracking-widest">(Press ESC to Exit)</p>
            </div>
         </div>
      )}

      {viewMode === 'walk-locked' && (
         <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/80 rounded-full z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-md"></div>
      )}

      {/* ── 3D CANVAS COMPONENT ── */}
      <Canvas shadows camera={{ position: [0, 5, 25], fov: 65 }} className="absolute inset-0 z-0">
        
        <TheatreEnvironment config={config} />

        {/* ── SCREEN WITH DYNAMIC MEDIA TEXTURE ── */}
        <mesh position={[0, config.screenHeight / 2 + 1.5, 0]} castShadow>
          <planeGeometry args={[config.screenWidth, config.screenHeight]} />
          <Suspense fallback={<meshBasicMaterial color="#ffffff" emissiveIntensity={0.8} />}>
             <ScreenContent mediaUrl={mediaUrl} mediaType={mediaType} config={config} />
          </Suspense>
        </mesh>
        
        {/* Glow behind screen */}
        <mesh position={[0, config.screenHeight / 2 + 1.5, -0.5]}>
           <planeGeometry args={[config.screenWidth + 5, config.screenHeight + 5]} />
           <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
        </mesh>

        {/* ── HIGH VISIBILITY SEATS INSTANCES ── */}
        <Instances limit={5000} castShadow receiveShadow>
          <boxGeometry args={[0.75, 0.95, 0.75]} />
          {/* Seats use vibrant standard material */}
          <meshStandardMaterial roughness={0.1} metalness={0.1} />
          
          {seats.map((seat) => {
            const isSelected = selectedSeat?.id === seat.id;
            
            // Bright vibrant colors for max visibility
            let color = seat.isBooked ? '#475569' : '#8b5cf6'; // Violet for available, gray for booked
            
            if (isSelected) {
               color = '#f97316'; // Bright Hot Orange for Active Selected
            } else if (showQuality) {
               if (seat.qualityScore >= 8.5) color = '#10b981';      
               else if (seat.qualityScore >= 6.5) color = '#fbbf24'; 
               else color = '#ef4444';                               
            }

            return (
              <Instance
                key={seat.id}
                position={[seat.x, seat.y + 0.5, seat.z]}
                color={new THREE.Color(color)}
                onClick={(e) => {
                  e.stopPropagation();
                  // Prevent selecting booked seats
                  if (seat.isBooked) return;

                  setSelectedSeat(seat);
                  if (onSeatChange) onSeatChange(seat.rowNum, seat.colNum);
                  if (viewMode.includes('walk')) setViewMode('seat');
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  if(viewMode === 'free' && !seat.isBooked) document.body.style.cursor = 'pointer';
                  if(seat.isBooked) document.body.style.cursor = 'not-allowed';
                }}
                onPointerOut={(e) => {
                   if(viewMode === 'free') document.body.style.cursor = 'auto';
                }}
              />
            );
          })}
        </Instances>

        <CameraController 
           mode={viewMode} 
           targetSeat={selectedSeat} 
           screenCenter={screenCenter} 
           config={config} 
           onUnlock={handleUnlock}
        />
        
      </Canvas>
    </div>
  );
};
