
import React, { useEffect, useRef, useState } from 'react';
import { handTracker } from './services/handTracking';
import { MagicCake } from './components/Cake';
import { Circle } from './components/Circle';
import { Heart } from './components/Heart';
import { AppState, HandData, ShapeMode } from './types';

const SMOOTHING = 0.2;
const CLENCH_THRESHOLD = 0.28; 
const RESET_THRESHOLD = 0.45;  

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    cameraReady: false,
    trackingActive: false,
    performanceMode: 'Medium',
    openness: 1.0,
    debug: false
  });

  const [handInfo, setHandInfo] = useState<HandData>({
    openness: 1.0,
    detected: false,
    handType: 'None',
    landmarks: []
  });

  // 支持 3 个阶段：0: 蛋糕, 1: 回忆墙, 2: 祝福心形
  const [activeMode, setActiveMode] = useState(0);
  const isClenchedRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const opennessRef = useRef(1.0);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setState(prev => ({ ...prev, cameraReady: true, trackingActive: true }));
          handTracker.initialize().then(() => {
            if (videoRef.current) handTracker.setVideoElement(videoRef.current);
          });
        };
      }
    } catch (err) {
      alert("Camera access denied. Interaction requires a webcam.");
    }
  };

  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      const result = handTracker.detect();
      
      let targetOpenness = opennessRef.current;
      let isDetected = false;
      let hType: 'Left' | 'Right' | 'Both' | 'None' = 'None';
      let currentLandmarks: any[] = [];

      if (result && result.landmarks && result.landmarks.length > 0) {
        isDetected = true;
        currentLandmarks = result.landmarks;
        let combined = 0;
        result.landmarks.forEach((hand: any) => {
          combined += handTracker.calculateOpenness(hand);
        });
        
        let forcedClosed = false;
        if (result.landmarks.length === 2) {
          hType = 'Both';
          const h1 = result.landmarks[0][0];
          const h2 = result.landmarks[1][0];
          const dist = Math.sqrt(Math.pow(h1.x - h2.x, 2) + Math.pow(h1.y - h2.y, 2));
          if (dist < 0.18) forcedClosed = true;
        } else {
          hType = result.handedness[0][0].displayName as any;
        }

        targetOpenness = forcedClosed ? 0 : combined / result.landmarks.length;
      } else {
        targetOpenness = 1.0;
      }

      opennessRef.current = (targetOpenness * SMOOTHING) + (opennessRef.current * (1 - SMOOTHING));
      
      if (opennessRef.current < CLENCH_THRESHOLD && !isClenchedRef.current) {
        isClenchedRef.current = true;
      } else if (opennessRef.current > RESET_THRESHOLD && isClenchedRef.current) {
        isClenchedRef.current = false;
        // 模式切换逻辑：0 -> 1 -> 2 -> 0
        setActiveMode(prev => (prev + 1) % 3);
      }

      setHandInfo(prev => ({
        ...prev,
        openness: opennessRef.current,
        detected: isDetected,
        handType: hType,
        landmarks: currentLandmarks
      }));

      requestAnimationFrame(loop);
    };
    loop();
    return () => { active = false; };
  }, [state.trackingActive]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020202] select-none text-white font-sans">
      
      {/* 阶段 0: 蛋糕粒子 */}
      {activeMode === 0 && (
        <MagicCake 
          t={handInfo.openness} 
          shapeMode={ShapeMode.CAKE} 
        />
      )}

      {/* 阶段 1: 回忆墙 3D Carousel */}
      {activeMode === 1 && (
        <Circle t={handInfo.openness} landmarks={handInfo.landmarks} />
      )}

      {/* 阶段 2: 祝福心形粒子 */}
      {activeMode === 2 && (
        <Heart t={handInfo.openness} />
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col pointer-events-none z-10">
        <div className="p-10 flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-extralight tracking-[0.3em] text-cyan-400 uppercase">Celestial Spark</h1>
            <p className="text-[10px] text-cyan-900 tracking-widest uppercase font-bold">Interactive Particle Sculpture</p>
          </div>
          
          <div className="pointer-events-auto flex gap-4">
             <button 
              onClick={() => setState(s => ({ ...s, debug: !s.debug }))}
              className="px-4 py-2 bg-white/5 border border-white/10 text-[9px] hover:bg-white/10 transition-all uppercase tracking-widest"
             >
              System Info: {state.debug ? 'On' : 'Off'}
             </button>
          </div>
        </div>

        {!state.cameraReady && (
          <div className="flex-1 flex items-center justify-center pointer-events-auto">
            <div className="text-center p-12 bg-black/40 backdrop-blur-xl border border-white/5 max-w-lg">
              <div className="w-16 h-1 bg-cyan-500 mx-auto mb-8" />
              <h2 className="text-5xl font-thin mb-6 tracking-wider">A Gift of Stardust</h2>
              <p className="text-gray-400 mb-10 font-light text-sm leading-relaxed px-6">
                Connect with the celestial dust using your hands. 
                <br /><br />
                <span className="text-cyan-400 font-medium italic">Hand Open:</span> Default Stars. 
                <br />
                <span className="text-white font-medium italic">Hand Close:</span> Reveal the next surprise.
              </p>
              <button 
                onClick={startCamera}
                className="px-12 py-5 bg-transparent border border-cyan-500/50 hover:bg-cyan-500 hover:text-black transition-all duration-500 uppercase tracking-[0.4em] text-xs font-bold"
              >
                Enter Experience
              </button>
            </div>
          </div>
        )}

        {state.cameraReady && (
          <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${handInfo.detected ? 'bg-cyan-400 animate-pulse shadow-[0_0_15px_cyan]' : 'bg-white/10'}`} />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
                  {handInfo.detected ? `${handInfo.handType} Interaction Active` : 'Waiting for hand...'}
                </span>
              </div>
              
              {state.debug && (
                <div className="bg-black/50 p-4 border border-white/5 backdrop-blur-md">
                  <div className="text-[9px] font-mono text-cyan-500/80 uppercase space-y-1">
                    <div>Fidelity: High (WebGL Accelerated)</div>
                    <div>Active Mode ID: {activeMode}</div>
                    <div>Openness: {(handInfo.openness * 100).toFixed(0)}%</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="relative w-64 h-[2px] bg-white/5">
                <div 
                  className="absolute right-0 top-0 h-full bg-cyan-400 shadow-[0_0_10px_cyan] transition-all duration-75" 
                  style={{ width: `${(1 - handInfo.openness) * 100}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Form Synthesis</span>
            </div>
          </div>
        )}
      </div>

      <div className={`fixed bottom-10 left-10 z-50 transition-opacity duration-1000 ${state.cameraReady ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 to-transparent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="relative w-48 h-36 object-cover rounded-lg border border-white/10 shadow-2xl scale-x-[-1]" 
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded text-[8px] uppercase tracking-widest text-white/50 border border-white/5">
            Live Input
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
