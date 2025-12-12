export interface GiftMessage {
  id: string;
  to: string;
  message: string;
  color: string;
}

// Props for the main scene
export interface TreeSceneProps {
  onGiftClick: (gift: GiftMessage) => void;
  isExploded: boolean;
}

// Fix for missing JSX Intrinsic Elements definitions
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // HTML Elements
      div: any;
      span: any;
      h1: any;
      h2: any;
      h3: any;
      p: any;
      button: any;
      br: any;

      // React Three Fiber Elements
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      instancedMesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      instancedBufferAttribute: any;
      group: any;
      mesh: any;
      boxGeometry: any;
      octahedronGeometry: any;
      pointLight: any;
      ambientLight: any;
      spotLight: any;
      color: any;
      planeGeometry: any;
      
      // Custom Shader Materials
      foliageMaterial: any;
      snowflakeMaterial: any;
      orbMaterial: any;
    }
  }
}