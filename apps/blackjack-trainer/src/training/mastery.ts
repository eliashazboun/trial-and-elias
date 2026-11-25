export const masteryThresholds = [
  { level: "Mastered", samples: 250, accuracy: 0.98 },
  { level: "Advanced", samples: 100, accuracy: 0.95 },
  { level: "Proficient", samples: 30, accuracy: 0.9 },
  { level: "Developing", samples: 5, accuracy: 0 },
];
export const proficiency = {
  samples: 30,
  accuracy: 0.9,
  independentSamples: 100,
};
export function mastery(attempts: number, correct: number) {
  return (
    masteryThresholds.find(
      (t) =>
        attempts >= t.samples && correct / Math.max(1, attempts) >= t.accuracy,
    )?.level ?? "Learning"
  );
}
