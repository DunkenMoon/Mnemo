export const FEATURES = {
  // P0 — always on
  upload: true,
  graph3d: true,
  flashcards: true,

  // P1 — on for demo
  deleteDocuments: true,
  splitPanel: true,

  // P2 — enable if ahead of schedule
  progressPage: process.env.NEXT_PUBLIC_FF_PROGRESS !== "false",
  suggestions: process.env.NEXT_PUBLIC_FF_SUGGEST === "true",

  // P3 — cut if running out of time
  memoryDecay: process.env.NEXT_PUBLIC_FF_DECAY === "true",
  spatialRecall: process.env.NEXT_PUBLIC_FF_SPATIAL === "true",
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
