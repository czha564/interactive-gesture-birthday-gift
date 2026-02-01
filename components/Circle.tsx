
import React, { useEffect, useState, useRef } from 'react';

/**
 * 视觉与交互规格：
 * 1. 动态 3D 缩放：根据图片在圆环中的实时位置计算缩放比例。
 *    - 正前方 (0°)：缩放最大 (约 1.2x)
 *    - 两侧 (90°/270°)：中等缩放 (约 0.8x)
 *    - 正后方 (180°)：最小缩放 (约 0.5x)
 * 2. 始终面向镜头：通过抵消父级旋转，使图片在转动过程中始终正对用户。
 * 3. 食指追踪旋转：计算食指相对于屏幕中心的角度变化，驱动圆环旋转。
 * 4. 视觉深度：增加透明度随深度变化的逻辑，进一步增强空间感。
 */

const PHOTO_DATA = [
  { name: "NICK & JUDY 01", src: "https://i.ibb.co/bRqyyKDK/1.jpg" },
  { name: "NICK & JUDY 02", src: "https://i.ibb.co/yc9mCQFj/4.jpg" },
  { name: "NICK & JUDY 03", src: "https://i.ibb.co/wqDP2M3/5.jpg" },
  { name: "NICK & JUDY 04", src: "https://i.ibb.co/tPDM7FCy/6.jpg" },
  { name: "NICK & JUDY 05", src: "https://i.ibb.co/Z1J0qJcL/7.jpg" },
  { name: "NICK & JUDY 06", src: "https://i.ibb.co/JR1j5DGC/8.jpg" },
];

interface CircleProps {
  t: number; 
  landmarks: any[]; 
}

export const Circle: React.FC<CircleProps> = ({ t, landmarks }) => {
  const [rotation, setRotation] = useState(0);
  const lastAngleRef = useRef<number | null>(null);
  const accumulatedRotationRef = useRef(0);
  const autoRotationRef = useRef(0);
  const requestRef = useRef<number>(0);

  // 动画循环处理自动旋转
  useEffect(() => {
    const animate = () => {
      autoRotationRef.current += 0.15;
      setRotation(autoRotationRef.current + accumulatedRotationRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // 手势互动逻辑
  useEffect(() => {
    if (landmarks && landmarks.length > 0) {
      const hand = landmarks[0];
      const indexTip = hand[8]; // 食指尖

      // 计算相对于屏幕中心 (0.5, 0.5) 的角度
      const dx = indexTip.x - 0.5;
      const dy = indexTip.y - 0.5;
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      if (lastAngleRef.current !== null) {
        let delta = currentAngle - lastAngleRef.current;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        
        // 累加手势引起的旋转 - 降低灵敏度系数 (从 1.8 降至 0.7)
        accumulatedRotationRef.current += delta * 0.7;
      }
      lastAngleRef.current = currentAngle;
    } else {
      lastAngleRef.current = null;
    }
  }, [landmarks]);

  // 基础参数
  const opacity = Math.max(0, 1 - (t * 2.5)); 
  const globalScale = 0.9 + (1 - t) * 0.1;
  const radius = 380 + (t * 600);
  const count = PHOTO_DATA.length;

  // 最终旋转角度（顺滑处理）
  const finalRotation = rotation * (1 - t);

  if (opacity <= 0) return null;

  return (
    <div 
      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-700"
      style={{ opacity, perspective: '2000px' }}
    >
      <div 
        className="relative w-full h-full flex flex-col items-center justify-center transition-transform duration-1000 ease-out"
        style={{ transform: `scale(${globalScale})`, transformStyle: 'preserve-3d' }}
      >
        {/* 顶部标题 */}
        <div 
          className="absolute top-[8%] transition-all duration-1000"
          style={{ transform: `translateZ(200px) translateY(${t * -120}px)`, opacity: 1 - t }}
        >
          <div className="flex flex-col items-center">
            <div className="h-[1px] w-16 bg-amber-500/50 mb-6" />
            <h2 className="text-5xl font-extralight tracking-[0.8em] text-amber-200 uppercase drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              Memory Wall
            </h2>
            <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mt-6" />
            <p className="mt-4 text-[10px] tracking-[0.4em] text-amber-500/80 uppercase animate-pulse font-medium">
              Circle your finger to rotate memories
            </p>
          </div>
        </div>

        {/* 3D 旋转容器 */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: `translateY(100px) rotateY(${finalRotation}deg) rotateX(${(1-t) * 8}deg)` 
          }}
        >
          {PHOTO_DATA.map((photo, i) => {
            const baseAngle = (i * 360) / count;
            // 当前图片相对于观众的实际角度
            const currentTotalAngle = (baseAngle + finalRotation) % 360;
            const radians = (currentTotalAngle * Math.PI) / 180;
            const cos = Math.cos(radians);
            
            /**
             * 动态缩放逻辑：
             * cos 在 0° 为 1 (前方) -> 缩放 1.2
             * cos 在 90°/270° 为 0 (侧方) -> 缩放 0.8
             * cos 在 180° 为 -1 (后方) -> 缩放 0.5
             */
            const itemScale = 0.85 + 0.35 * cos;
            const itemOpacity = 0.5 + 0.5 * ((cos + 1) / 2); // 后方图片稍微透明一点

            // 变换组合：
            // 1. rotateY(baseAngle): 确定在圆环上的位置
            // 2. translateZ(radius): 推到圆环边缘
            // 3. rotateY(-baseAngle - finalRotation): 抵消旋转，使其始终面向摄像机
            // 4. scale: 应用深度缩放
            const itemTransform = `
              rotateY(${baseAngle}deg) 
              translateZ(${radius}px) 
              rotateY(${-baseAngle - finalRotation}deg)
              scale(${itemScale})
            `;

            return (
              <div 
                key={i}
                className="absolute aspect-[4/5] w-64 bg-[#050505] border border-cyan-500/40 overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)] group transition-all duration-300 ease-out"
                style={{ 
                  transform: itemTransform,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  opacity: itemOpacity,
                  zIndex: Math.round(cos * 100), // 辅助手动层级处理
                }}
              >
                <img 
                  src={photo.src} 
                  alt={photo.name}
                  className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* 装饰与蒙版 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                {/* 扫描线 */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(0deg,transparent_0%,rgba(0,255,255,0.5)_50%,transparent_100%)] bg-[length:100%_10px] animate-[pulse_4s_infinite]" />

                <div className="absolute bottom-5 left-5 right-5 text-left transition-opacity duration-500" style={{ opacity: cos > 0.5 ? 1 : 0 }}>
                  <div className="h-[1px] w-8 bg-cyan-400 mb-2 shadow-[0_0_10px_cyan]" />
                  <p className="text-[10px] tracking-[0.3em] text-cyan-50 font-light uppercase truncate">
                    {photo.name}
                  </p>
                </div>

                <div className="absolute inset-0 border border-white/5 group-hover:border-cyan-400/30 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
