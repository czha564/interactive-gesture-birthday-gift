
import React, { useRef, useEffect } from 'react';
import { Particle, PARTICLE_COUNT, COLORS, ShapeMode } from '../types';

interface MagicCakeProps {
  t: number; // 0 (Cake) to 1 (Stardust)
  shapeMode: ShapeMode;
}

interface MultiShapeParticle extends Particle {
  cakeOffsetX: number;
  cakeOffsetY: number;
  starX: number; 
  starY: number; 
}

export const MagicCake: React.FC<MagicCakeProps> = ({ t, shapeMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<MultiShapeParticle[]>([]);
  const requestRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const particles: MultiShapeParticle[] = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = i / PARTICLE_COUNT;
      
      // 1. 3-Tier Cake Shape Logic
      let cX = 0, cY = 0, isCandle = false, isFlame = false;
      if (p < 0.40) { 
        cX = (Math.random() - 0.5) * 320; 
        cY = -Math.random() * 80; 
      } else if (p < 0.68) { 
        cX = (Math.random() - 0.5) * 220; 
        cY = -(80 + Math.random() * 70); 
      } else if (p < 0.88) { 
        cX = (Math.random() - 0.5) * 120; 
        cY = -(150 + Math.random() * 60); 
      } else if (p < 0.91) { 
        // Candle - Slimmer
        isCandle = true; 
        cX = (Math.random() - 0.5) * 4; 
        cY = -(210 + Math.random() * 30); 
      } else if (p < 0.95) { 
        // Flame - Smaller area
        isFlame = true; 
        const fp = Math.random(); 
        cX = (Math.random() - 0.5) * (6 * (1 - fp)); 
        cY = -(240 + fp * 30); 
      } else { 
        cX = (Math.random() - 0.5) * 380; 
        cY = -(340 + Math.random() * 30); 
      }

      // 2. Ultra-Dispersed Stardust Logic
      const starX = (Math.random() - 0.5) * width * 1.8 + width / 2;
      const starY = (Math.random() - 0.5) * height * 1.8 + height / 2;

      particles.push({
        id: i,
        current: { x: starX, y: starY },
        target: { x: 0, y: 0 },
        dispersed: { x: starX, y: starY },
        history: [],
        phase: Math.random() * Math.PI * 2,
        size: 0.5 + Math.random() * 2.0,
        color: isFlame ? '#FF4500' : (isCandle ? '#FFFFFF' : COLORS[Math.floor(Math.random() * COLORS.length)]),
        isCandle,
        isFlame,
        noiseOffset: Math.random() * 1000,
        cakeOffsetX: cX,
        cakeOffsetY: cY,
        starX,
        starY,
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
      particlesRef.current.forEach(p => {
        p.starX = (Math.random() - 0.5) * canvas.width * 1.8 + canvas.width / 2;
        p.starY = (Math.random() - 0.5) * canvas.height * 1.8 + canvas.height / 2;
      });
    }

    const centerX = canvas.width / 2;
    const baseY = (canvas.height / 2) + 120;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Particles
    ctx.globalCompositeOperation = 'lighter';
    particlesRef.current.forEach(p => {
      const cakeX = centerX + p.cakeOffsetX;
      const cakeY = baseY + p.cakeOffsetY;

      const radialPush = 1.0 + (t * 0.2); 
      const destX = cakeX * (1 - t) + p.starX * t * radialPush;
      const destY = cakeY * (1 - t) + p.starY * t * radialPush;

      const drift = dt * (0.3 + t * 0.5);
      const swirlFactor = (t * 40) + (Math.sin(dt + p.noiseOffset) * 2);
      
      p.current.x = destX + Math.cos(drift + p.noiseOffset) * swirlFactor;
      p.current.y = destY + Math.sin(drift + p.noiseOffset) * swirlFactor;

      const sparkle = 0.5 + Math.sin(dt * 7 + p.phase) * 0.5;
      const flameInten = p.isFlame ? (1.3 + Math.sin(dt * 18) * 0.4) * (1 - t) : 1.0;
      const finalSize = p.size * (0.6 + sparkle * 0.6) * (p.isFlame ? Math.max(0.7, flameInten) : 1.0);

      const glowFactor = p.isFlame ? (7 * (1 - t) + 3 * t) : 4;
      const glowSize = finalSize * glowFactor;
      
      ctx.globalAlpha = (0.05 + sparkle * 0.7) * (1 - (t * 0.2)); 
      
      const grad = ctx.createRadialGradient(p.current.x, p.current.y, 0, p.current.x, p.current.y, glowSize);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.current.x, p.current.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = (p.isFlame && t < 0.1) || p.isCandle ? '#FFF' : p.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(p.current.x, p.current.y, finalSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw "Happy Birthday" Text
    // Only show text when hand is close to closed (t -> 0)
    const textAlpha = Math.max(0, 1 - (t * 2));
    if (textAlpha > 0) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';
      
      // Floating motion
      const floatY = Math.sin(dt * 2) * 10;
      const textY = baseY - 320 + floatY;

      // Glow effect for text
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00FFFF';
      
      // Main text font
      ctx.font = '300 42px "Inter", sans-serif';
      ctx.letterSpacing = '12px';
      ctx.fillStyle = '#E0FFFF';
      ctx.fillText('HAPPY BIRTHDAY', centerX, textY);
      
      // Reset shadow for performance
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [t, shapeMode]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};
