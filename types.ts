
export interface HandData {
  openness: number; // 0 (fist) to 1 (open)
  detected: boolean;
  handType: 'Left' | 'Right' | 'Both' | 'None';
  landmarks: any[];
}

export interface AppState {
  cameraReady: boolean;
  trackingActive: boolean;
  performanceMode: 'Low' | 'Medium' | 'High';
  openness: number;
  debug: boolean;
}

export enum ParticleCount {
  Low = 1500,
  Medium = 3000,
  High = 5000
}

export enum ShapeMode {
  CAKE = 'CAKE',
  PICTURES = 'PICTURES',
  SPHERE = 'SPHERE'
}

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  current: Point;
  target: Point;
  dispersed: Point;
  history: Point[];
  phase: number;
  size: number;
  color: string;
  isCandle: boolean;
  isFlame: boolean;
  noiseOffset: number;
}

export const PARTICLE_COUNT = 3000;
export const COLORS = ['#00FFFF', '#008080', '#E0FFFF', '#7FFFD4', '#40E0D0'];
export const TRAIL_LENGTH = 0;
