
export interface CharConfig {
  char: string;
  color: string;
}

export interface Decoration {
  id: string;
  type: '!' | '?' | 'arrow' | 'star';
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  strokeColor: string;
}

export interface ThumbnailData {
  script: string;
  referenceImageBase64?: string;
  suggestedText: string;
  backgroundUrl: string;
  styleAnalysis: string;
  styleType: 'artistic' | 'realistic';
}

export interface TextSettings {
  chars: CharConfig[];
  fontFamily: string;
  fontSize: number;
  strokeColor: string;
  strokeWidth: number;
  lineHeight: number;
  x: number;
  y: number;
  shadow: boolean;
}

export interface AIAnalysisResult {
  text: string;
  styleDescription: string;
  styleType: 'artistic' | 'realistic';
}
