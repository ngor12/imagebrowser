export interface SizePreset {
  name: string;
  width: number;
  height: number;
  icon: string;
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  shadow: boolean;
}

export interface CanvasState {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage: string | null; // Base64 or URL
  overlayOpacity: number;
}

export enum GenerationStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}