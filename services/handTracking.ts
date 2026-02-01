
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export class HandTrackingService {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private lastVideoTime = -1;

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2
    });
  }

  setVideoElement(video: HTMLVideoElement) {
    this.video = video;
  }

  detect(): any {
    if (!this.handLandmarker || !this.video || this.video.readyState < 2) return null;

    const startTimeMs = performance.now();
    if (this.lastVideoTime !== this.video.currentTime) {
      this.lastVideoTime = this.video.currentTime;
      return this.handLandmarker.detectForVideo(this.video, startTimeMs);
    }
    return null;
  }

  calculateOpenness(landmarks: any[]): number {
    if (!landmarks || landmarks.length === 0) return 1.0;

    const wrist = landmarks[0];
    const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    
    const scale = Math.sqrt(
      Math.pow(landmarks[9].x - wrist.x, 2) + 
      Math.pow(landmarks[9].y - wrist.y, 2)
    ) || 0.1;

    let avgDist = 0;
    tips.forEach(tip => {
      const dist = Math.sqrt(
        Math.pow(tip.x - wrist.x, 2) + 
        Math.pow(tip.y - wrist.y, 2)
      );
      avgDist += dist;
    });
    
    avgDist /= tips.length;

    // Extremely sensitive: Map 1.5-2.2 to 0-1.
    // This makes it very easy to reach "1.0" (default state) with a relaxed hand.
    const normalized = (avgDist / scale - 1.5) / 0.7;
    return Math.max(0, Math.min(1, normalized));
  }
}

export const handTracker = new HandTrackingService();
