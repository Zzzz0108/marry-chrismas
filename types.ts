export interface GiftMessage {
  id: string;
  to: string;
  message: string;
  color: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Particle extends Point3D {
  size: number;
  color: string;
  type: 'tree' | 'trunk' | 'snow' | 'gift' | 'star' | 'light' | 'ornament';
  giftId?: string; // Only for gift particles
  originalY?: number; // For tree spiral calculation
  angleOffset?: number; // For tree spiral calculation
  speed?: number; // For snow
  opacity: number;
  blinkOffset?: number; // For lights
}

export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}