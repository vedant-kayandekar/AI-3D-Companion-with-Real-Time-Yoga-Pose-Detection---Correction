/**
 * Constants for the yoga pose detection system.
 * MoveNet keypoint indices, skeleton connections, pose metadata.
 */

// ── MoveNet 17 Keypoint Indices ─────────────────────────────
export const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

// ── Skeleton Connections (pairs of keypoint indices) ────────
export const SKELETON_CONNECTIONS = [
  [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER],
  [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_ELBOW],
  [KEYPOINTS.LEFT_ELBOW, KEYPOINTS.LEFT_WRIST],
  [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_ELBOW],
  [KEYPOINTS.RIGHT_ELBOW, KEYPOINTS.RIGHT_WRIST],
  [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_HIP],
  [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_HIP],
  [KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP],
  [KEYPOINTS.LEFT_HIP, KEYPOINTS.LEFT_KNEE],
  [KEYPOINTS.LEFT_KNEE, KEYPOINTS.LEFT_ANKLE],
  [KEYPOINTS.RIGHT_HIP, KEYPOINTS.RIGHT_KNEE],
  [KEYPOINTS.RIGHT_KNEE, KEYPOINTS.RIGHT_ANKLE],
];

// ── Pose Metadata ───────────────────────────────────────────
export const POSES = {
  Tadasana: {
    english: "Mountain Pose",
    type: "standing",
    emoji: "🏔️",
    description: "Stand tall with feet together, arms at sides or overhead.",
    totalSteps: 5,
    steps: [
      "Stand with feet together on the mat, weight evenly distributed.",
      "Engage your thighs, lift kneecaps gently.",
      "Lengthen your spine, roll shoulders back and down.",
      "Raise arms overhead with palms facing each other.",
      "Hold the pose, breathe deeply. Gaze forward.",
    ],
  },
  Bhujangasana: {
    english: "Cobra Pose",
    type: "prone",
    emoji: "🐍",
    description: "Lie prone, lift chest using back muscles.",
    totalSteps: 3,
    steps: [
      "Lie face down, palms beside chest, elbows close to body.",
      "Press palms down, lift chest off the floor using back muscles.",
      "Straighten arms partially, open chest, look slightly up.",
    ],
  },
  Parvatasana: {
    english: "Mountain / Downward Pose",
    type: "standing",
    emoji: "⛰️",
    description: "Seated or standing with arms raised overhead, palms together.",
    totalSteps: 4,
    steps: [
      "Sit in Vajrasana or stand with feet hip-width apart.",
      "Interlace fingers, turn palms up, raise arms overhead.",
      "Stretch upward, keeping spine long and shoulders down.",
      "Hold and breathe deeply. Keep arms straight and active.",
    ],
  },
  Anantasana: {
    english: "Side-Lying Leg Raise",
    type: "reclining",
    emoji: "🛌",
    description: "Lie on one side, raise top leg while holding the toe.",
    totalSteps: 4,
    steps: [
      "Lie on your left side, body in one straight line.",
      "Support head with left hand, bend elbow.",
      "Bend right knee, hold right big toe with right hand.",
      "Extend right leg toward ceiling. Hold and breathe.",
    ],
  },
  Marjariasana: {
    english: "Cat Pose",
    type: "all-fours",
    emoji: "🐱",
    description: "Tabletop position, alternating between arching and rounding the spine.",
    totalSteps: 4,
    steps: [
      "Come to all fours — knees under hips, wrists under shoulders.",
      "Inhale: Drop belly, lift head and tailbone (Cow).",
      "Exhale: Round spine up, tuck chin to chest (Cat).",
      "Continue flowing between Cat and Cow with breath.",
    ],
  },
  Sarvangasana: {
    english: "Shoulder Stand",
    type: "inversion",
    emoji: "🤸",
    description: "Inverted pose resting on shoulders with legs extended upward.",
    totalSteps: 2,
    steps: [
      "Lie on back, lift legs and hips, support lower back with hands.",
      "Straighten legs upward, keep body vertical. Hold and breathe.",
    ],
  },
  Vajrasana: {
    english: "Thunderbolt / Diamond Pose",
    type: "sitting",
    emoji: "💎",
    description: "Kneel and sit back on heels with spine erect.",
    totalSteps: 2,
    steps: [
      "Kneel on the mat, sit back so buttocks rest on heels.",
      "Keep spine erect, hands on thighs, shoulders relaxed. Breathe.",
    ],
  },
};

// ── Body Part → Angle Mapping ───────────────────────────────
export const BODY_PART_ANGLES = {
  Legs: ["left_knee_angle", "right_knee_angle"],
  Knee: ["left_knee_angle", "right_knee_angle"],
  Knees: ["left_knee_angle", "right_knee_angle"],
  Hand: ["left_elbow_angle", "right_elbow_angle"],
  Hands: ["left_elbow_angle", "right_elbow_angle"],
  Head: ["spine_tilt"],
  Neck: ["spine_tilt"],
  Back: ["spine_tilt"],
  Standing: ["hip_alignment", "spine_tilt", "shoulder_alignment"],
  "Legs and Hand": ["left_knee_angle", "right_knee_angle", "left_elbow_angle", "right_elbow_angle"],
  "Hands and Legs": ["left_knee_angle", "right_knee_angle", "left_elbow_angle", "right_elbow_angle"],
  "Leg and Hand": ["left_knee_angle", "right_knee_angle", "left_elbow_angle", "right_elbow_angle"],
  "Back and Head": ["spine_tilt"],
};

// ── Angle → Body Part (for skeleton highlighting) ───────────
export const ANGLE_TO_KEYPOINTS = {
  left_knee_angle: [KEYPOINTS.LEFT_HIP, KEYPOINTS.LEFT_KNEE, KEYPOINTS.LEFT_ANKLE],
  right_knee_angle: [KEYPOINTS.RIGHT_HIP, KEYPOINTS.RIGHT_KNEE, KEYPOINTS.RIGHT_ANKLE],
  left_elbow_angle: [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_ELBOW, KEYPOINTS.LEFT_WRIST],
  right_elbow_angle: [KEYPOINTS.RIGHT_SHOULDER, KEYPOINTS.RIGHT_ELBOW, KEYPOINTS.RIGHT_WRIST],
  hip_alignment: [KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP],
  spine_tilt: [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.LEFT_HIP],
  shoulder_alignment: [KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER],
};

// ── Detection Config ────────────────────────────────────────
export const DETECTION_CONFIG = {
  CONFIDENCE_THRESHOLD: 0.3,       // Min keypoint confidence to draw
  POSE_CONFIDENCE_THRESHOLD: 0.6,  // Min classifier confidence
  DETECTION_INTERVAL_MS: 150,      // How often to run full pipeline
  CANVAS_WIDTH: 640,
  CANVAS_HEIGHT: 480,
  CORRECT_HOLD_THRESHOLD_S: 2,     // Seconds to hold correct before "completed"
};
