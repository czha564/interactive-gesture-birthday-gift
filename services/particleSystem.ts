
import * as THREE from 'three';
import { ParticleCount, AppState } from '../types';
import { COLORS, CAKE_PARAMS } from '../constants';

export class ParticleSystem {
  public mesh: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private count: number;

  constructor(count: number) {
    this.count = count;
    this.geometry = new THREE.BufferGeometry();
    
    const basePositions = new Float32Array(count * 3);
    const dispersedPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 3);

    // Generate shapes
    this.generateCakeShape(basePositions);
    this.generateGalaxyShape(dispersedPositions);
    for (let i = 0; i < count * 3; i++) randoms[i] = Math.random();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(basePositions, 3));
    this.geometry.setAttribute('aBasePosition', new THREE.BufferAttribute(basePositions, 3));
    this.geometry.setAttribute('aDispersedPosition', new THREE.BufferAttribute(dispersedPositions, 3));
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpenness: { value: 1.0 },
        uColor1: { value: new THREE.Color(COLORS.CYAN) },
        uColor2: { value: new THREE.Color(COLORS.TEAL) },
        uColorFlame: { value: new THREE.Color(COLORS.FLAME) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uOpenness;
        attribute vec3 aBasePosition;
        attribute vec3 aDispersedPosition;
        attribute vec3 aRandom;
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          // Morph between shapes
          vec3 pos = mix(aBasePosition, aDispersedPosition, uOpenness);
          
          // Add swirl/noise
          float noise = sin(uTime * 0.5 + aRandom.x * 10.0) * 0.1;
          if(uOpenness > 0.1) {
             pos.x += sin(uTime * 0.2 + pos.z * 0.5) * uOpenness * 2.0;
             pos.z += cos(uTime * 0.2 + pos.x * 0.5) * uOpenness * 2.0;
          } else {
             // Micro vibration in cake mode
             pos += (aRandom - 0.5) * 0.02;
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (15.0 / -mvPosition.z) * (1.0 + aRandom.y * 2.0);
          gl_Position = projectionMatrix * mvPosition;
          
          vAlpha = 0.8 * (1.0 - uOpenness * 0.5);
          vColor = mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 0.5, 0.5), aRandom.z);
          
          // Flame effect for top particles
          if(aBasePosition.y > 1.5 && uOpenness < 0.2) {
             vColor = vec3(1.0, 0.3, 0.1);
             gl_PointSize *= 1.5;
          }
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if(d > 0.5) discard;
          float strength = 1.0 - (d * 2.0);
          gl_FragColor = vec4(vColor, strength * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  private generateCakeShape(arr: Float32Array) {
    const pointsPerTier = Math.floor(this.count / 3.5);
    let idx = 0;

    // Tier 1 (Bottom)
    this.fillCylinder(arr, idx, pointsPerTier, CAKE_PARAMS.TIER1_RADIUS, CAKE_PARAMS.TIER1_HEIGHT, CAKE_PARAMS.Y_OFFSET);
    idx += pointsPerTier * 3;

    // Tier 2 (Middle)
    this.fillCylinder(arr, idx, pointsPerTier, CAKE_PARAMS.TIER2_RADIUS, CAKE_PARAMS.TIER2_HEIGHT, CAKE_PARAMS.Y_OFFSET + CAKE_PARAMS.TIER1_HEIGHT);
    idx += pointsPerTier * 3;

    // Tier 3 (Top)
    this.fillCylinder(arr, idx, pointsPerTier, CAKE_PARAMS.TIER3_RADIUS, CAKE_PARAMS.TIER3_HEIGHT, CAKE_PARAMS.Y_OFFSET + CAKE_PARAMS.TIER1_HEIGHT + CAKE_PARAMS.TIER2_HEIGHT);
    idx += pointsPerTier * 3;

    // Candle / Flame
    const flameCount = this.count - (idx / 3);
    for (let i = 0; i < flameCount; i++) {
      const r = Math.random() * 0.15;
      const angle = Math.random() * Math.PI * 2;
      const h = Math.random() * 0.6;
      arr[idx++] = Math.cos(angle) * r;
      arr[idx++] = CAKE_PARAMS.Y_OFFSET + CAKE_PARAMS.TIER1_HEIGHT + CAKE_PARAMS.TIER2_HEIGHT + CAKE_PARAMS.TIER3_HEIGHT + h;
      arr[idx++] = Math.sin(angle) * r;
    }
  }

  private fillCylinder(arr: Float32Array, start: number, count: number, radius: number, height: number, yOffset: number) {
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * radius;
      const angle = Math.random() * Math.PI * 2;
      const h = Math.random() * height;
      arr[start + i * 3] = Math.cos(angle) * r;
      arr[start + i * 3 + 1] = yOffset + h;
      arr[start + i * 3 + 2] = Math.sin(angle) * r;
    }
  }

  private generateGalaxyShape(arr: Float32Array) {
    for (let i = 0; i < this.count; i++) {
      const r = 5.0 + Math.random() * 10.0;
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(angle);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(angle);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
  }

  update(time: number, openness: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uOpenness.value = openness;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
