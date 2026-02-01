
import React, { useEffect, useState, useRef } from 'react';

/**
 * 视觉规格：
 * 1. 3D 环状布局：利用 CSS preserve-3d 构建一个 3D 空间。
 * 2. 空间感：图片沿 Y 轴旋转并沿 Z 轴推开，形成圆环。
 * 3. 布局优化：将 "MEMORY WALL" 标题移至更高位置并增大字号，同时将图片环下移 80px 左右，避免遮挡。
 * 4. 颜色更新：将标题颜色改为金色 (Amber)，增加回忆的温馨感。
 */
const PHOTO_DATA = [
  { name: "NICK & JUDY 01", src: "https://i.ibb.co/bRqyyKDK/1.jpg" },
  { name: "NICK & JUDY 02", src: "https://i.ibb.co/yc9mCQFj/4.jpg" },
  { name: "NICK & JUDY 03", src: "https://i.ibb.co/wqDP2M3/5.jpg" },
  { name: "NICK & JUDY 04", src: "https://i.ibb.co/tPDM7FCy/6.jpg" },
  { name: "NICK & JUDY 05", src: "https://i.ibb.co/Z1J0qJcL/7.jpg" },
  { name: "NICK & JUDY 06", src: "https://i.ibb.co/JR1j5DGC/8.jpg" },
];

interface PictureProps {
  t: number; // 0 (握拳显示) 到 1 (张开隐藏)
}

export const Picture: React.FC<PictureProps> = ({ t }) => {
  const [rotation, setRotation] = useState(0);
  const requestRef = useRef<number>(0);

  // 自动旋转逻辑
  useEffect(() => {
    const animate = () => {
      setRotation(prev => prev + 0.15); // 缓慢自转
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // 基础透明度和整体缩放
  const opacity = Math.max(0, 1 - (t * 2.5)); 
  const globalScale = 0.9 + (1 - t) * 0.1;
  
  // 3D 环绕参数
  const radius = 350 + (t * 600); // 握拳时半径变小，张开时飞散
  const count = PHOTO_DATA.length;

  if (opacity <= 0) return null;

  return (
    <div 
      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-700"
      style={{ 
        opacity, 
        perspective: '1500px', // 增强 3D 透视深度
      }}
    >
      <div 
        className="relative w-full h-full flex flex-col items-center justify-center transition-transform duration-1000 ease-out"
        style={{ 
          transform: `scale(${globalScale})`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 顶部标题：MEMORY WALL - 颜色更改为金色 */}
        <div 
          className="absolute top-[8%] transition-all duration-1000"
          style={{ 
            transform: `translateZ(150px) translateY(${t * -120}px)`,
            opacity: 1 - t
          }}
        >
          <div className="flex flex-col items-center">
            <div className="h-[1px] w-16 bg-amber-500/50 mb-6" />
            <h2 className="text-5xl font-extralight tracking-[0.8em] text-amber-200 uppercase drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              Memory Wall
            </h2>
            <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mt-6" />
          </div>
        </div>

        {/* 3D 旋转容器 - 整体下移以腾出空间 */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: `translateY(80px) rotateY(${rotation * (1-t)}deg) rotateX(${(1-t) * 5}deg)` 
          }}
        >
          {PHOTO_DATA.map((photo, i) => {
            const angle = (i * 360) / count;
            const itemTransform = `
              rotateY(${angle}deg) 
              translateZ(${radius}px) 
              rotateY(${-angle}deg)
              scale(${i === 0 ? 1.2 : 0.85})
            `;

            return (
              <div 
                key={i}
                className="absolute aspect-[4/5] w-64 bg-[#0a0a0a] border border-cyan-500/30 overflow-hidden shadow-[0_0_60px_rgba(0,255,255,0.25)] group transition-all duration-700 ease-out"
                style={{ 
                  transform: itemTransform,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* 图片主体 */}
                <img 
                  src={photo.src} 
                  alt={photo.name}
                  className="w-full h-full object-cover opacity-95 transition-transform duration-[3s] group-hover:scale-110"
                />
                
                {/* 赛博风格装饰层 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/5 to-transparent" />
                
                {/* 扫描线光效 */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(0deg,transparent_0%,rgba(0,255,255,0.2)_50%,transparent_100%)] bg-[length:100%_4px] animate-[pulse_3s_infinite]" />

                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent shadow-[0_0_10px_cyan]" />
                
                <div className="absolute bottom-5 left-5 right-5 text-left">
                  <div className="h-[2px] w-10 bg-cyan-400 mb-2 shadow-[0_0_8px_cyan]" />
                  <p className="text-[11px] tracking-[0.4em] text-cyan-50 font-medium uppercase truncate drop-shadow-md">
                    {photo.name}
                  </p>
                </div>

                {/* 边框高亮 */}
                <div className="absolute inset-0 border border-white/10 group-hover:border-cyan-400/50 transition-colors duration-500" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
