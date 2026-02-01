
import React, { useRef, useEffect } from 'react';
import { PARTICLE_COUNT, COLORS } from '../types';

interface HeartProps {
  t: number; // 0 (Heart) to 1 (Stardust)
}

interface HeartParticle {
  id: number;
  current: { x: number, y: number };
  heartPos: { x: number, y: number };
  starX: number;
  starY: number;
  size: number;
  phase: number;
  noiseOffset: number;
}

export const Heart: React.FC<HeartProps> = ({ t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HeartParticle[]>([]);
  const requestRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const particles: HeartParticle[] = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 1. 计算心型坐标 (Parametric Heart Equation)
      // x = 16 sin^3(angle)
      // y = 13 cos(angle) - 5 cos(2angle) - 2 cos(3angle) - cos(4angle)
      const angle = Math.random() * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(angle), 3);
      const hy = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
      
      // 增加随机扰动使心形有厚度和体积感
      const spread = 0.8 + Math.random() * 0.4;
      const noise = (Math.random() - 0.5) * 2;
      
      const heartX = (hx * 12 * spread) + noise;
      const heartY = (hy * 12 * spread) + noise;

      // 2. 随机散点位置 (Stardust)
      const starX = (Math.random() - 0.5) * width * 2 + width / 2;
      const starY = (Math.random() - 0.5) * height * 2 + height / 2;

      particles.push({
        id: i,
        current: { x: starX, y: starY },
        heartPos: { x: heartX, y: heartY },
        starX,
        starY,
        size: 0.8 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        noiseOffset: Math.random() * 1000,
      });
    }
    particlesRef.current = particles;
  }, []);

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current = time / 1000;
    const dt = timeRef.current;
    
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 30;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'lighter';
    particlesRef.current.forEach(p => {
      // 插值计算：t=0 时在心形位置，t=1 时在星空散点位置
      const destX = (centerX + p.heartPos.x) * (1 - t) + p.starX * t;
      const destY = (centerY + p.heartPos.y) * (1 - t) + p.starY * t;

      // 动力学偏移
      const drift = dt * (0.4 + t * 0.6);
      const noise = Math.sin(dt + p.noiseOffset) * (2 + t * 10);
      
      p.current.x = destX + Math.cos(drift) * noise;
      p.current.y = destY + Math.sin(drift) * noise;

      const sparkle = 0.5 + Math.sin(dt * 5 + p.phase) * 0.5;
      const finalSize = p.size * (0.7 + sparkle * 0.5);
      
      // 心形的主色调：粉色与玫瑰红
      const isAltColor = p.id % 3 === 0;
      const color = isAltColor ? '#FF1493' : '#FF69B4'; // DeepPink vs HotPink
      
      ctx.globalAlpha = (0.1 + sparkle * 0.8) * (1 - (t * 0.3));
      
      // 粒子光晕
      const glowSize = finalSize * 5;
      const grad = ctx.createRadialGradient(p.current.x, p.current.y, 0, p.current.x, p.current.y, glowSize);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.current.x, p.current.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // 核心亮点
      ctx.fillStyle = '#FFF5F8';
      ctx.globalAlpha = 0.9 * (1-t);
      ctx.beginPath();
      ctx.arc(p.current.x, p.current.y, finalSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 文字渲染：Happy Birthday to 陈皓
    const textAlpha = Math.max(0, 1 - (t * 2.5));
    if (textAlpha > 0) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';
      
      const floatY = Math.sin(dt * 1.5) * 12;
      const textY = centerY - 280 + floatY;

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#FF1493';
      
      ctx.font = '200 48px "Inter", sans-serif';
      ctx.letterSpacing = '14px';
      ctx.fillStyle = '#FFF0F5';
      ctx.fillText('HAPPY BIRTHDAY', centerX, textY);

      ctx.font = '300 24px "Inter", sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillStyle = '#FF69B4';
      ctx.fillText('TO 陈皓', centerX, textY + 50);
      
      ctx.shadowBlur = 0;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [t]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-30 pointer-events-none" />;
};
