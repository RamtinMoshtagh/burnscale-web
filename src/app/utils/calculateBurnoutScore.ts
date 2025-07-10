// src/app/utils/calculateBurnoutScore.ts

export type Mood = 'Happy' | 'Meh' | 'Sad' | 'Angry';

interface BurnoutInput {
  mood: Mood;
  energy: number; // 1–5
  meaningfulness: number; // 1–5
  stressTriggers: string[];
}

export function calculateBurnoutScore({
  mood,
  energy,
  meaningfulness,
  stressTriggers,
}: BurnoutInput): number {
  const moodWeight: Record<Mood, number> = {
    Happy: 10,
    Meh: 40,
    Sad: 70,
    Angry: 90,
  };

  const moodScore = moodWeight[mood];
  const energyScore = 100 - energy * 20;
  const meaningScore = 100 - meaningfulness * 20;
  const stressScore = Math.min(stressTriggers.length * 20, 100);

  const average = (moodScore + energyScore + meaningScore + stressScore) / 4;
  return Math.round(average);
}
