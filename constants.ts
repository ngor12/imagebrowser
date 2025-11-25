import { SizePreset } from './types';

export const PRESETS: SizePreset[] = [
  { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: '▶️' },
  { name: 'Instagram Post', width: 1080, height: 1080, icon: '📸' },
  { name: 'Instagram Story', width: 1080, height: 1920, icon: '📱' },
  { name: 'Twitter/X Header', width: 1500, height: 500, icon: '🐦' },
  { name: 'Blogger Header', width: 1200, height: 400, icon: '📝' },
  { name: 'LinkedIn Banner', width: 1584, height: 396, icon: '💼' },
];

export const FONTS = [
  'Inter',
  'Arial',
  'Courier New',
  'Georgia',
  'Times New Roman',
  'Verdana'
];

export const DEFAULT_TEXT_LAYER = {
  text: 'Edit Me',
  x: 50,
  y: 50,
  fontSize: 60,
  color: '#ffffff',
  fontFamily: 'Inter',
  fontWeight: '700',
  shadow: true
};