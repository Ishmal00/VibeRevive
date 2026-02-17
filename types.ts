
export enum MoodType {
  HAPPY = 'Happy',
  SAD = 'Sad',
  ANGRY = 'Angry',
  ANXIOUS = 'Anxious',
  BORED = 'Bored',
  NEUTRAL = 'Neutral'
}

export interface Recommendation {
  id: string;
  type: 'activity' | 'exercise' | 'joke' | 'story' | 'quote' | 'roast';
  title: string;
  content: string;
  intensity: 'low' | 'medium' | 'high';
}

export interface VibeState {
  currentMood: MoodType;
  vibeScore: number; // 0-100
  history: { timestamp: number; score: number }[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}
