// Keypoint indices for MoveNet model
export const POINTS = {
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

// Skeleton connection map for drawing
export const keypointConnections = {
  nose: ["left_ear", "right_ear"],
  left_ear: ["left_shoulder"],
  right_ear: ["right_shoulder"],
  left_shoulder: ["right_shoulder", "left_elbow", "left_hip"],
  right_shoulder: ["right_elbow", "right_hip"],
  left_elbow: ["left_wrist"],
  right_elbow: ["right_wrist"],
  left_hip: ["left_knee", "right_hip"],
  right_hip: ["right_knee"],
  left_knee: ["left_ankle"],
  right_knee: ["right_ankle"],
};

// Pose class mapping for the classifier model
export const CLASS_NO = {
  Chair: 0,
  Cobra: 1,
  Dog: 2,
  No_Pose: 3,
  Shoulderstand: 4,
  Traingle: 5,
  Tree: 6,
  Warrior: 7,
};

// Supported pose list
export const poseList = [
  "Tree",
  "Chair",
  "Cobra",
  "Warrior",
  "Dog",
  "Shoulderstand",
  "Traingle",
];

// Detailed step-by-step instructions for each pose
export const poseInstructions = {
  Tree: [
    "Get into mountain pose (Tadasana) with both feet planted firmly and weight evenly distributed.",
    "Bend one leg at the knee. Rest the sole of your foot against your inner thigh (half-lotus). Point the knee outward.",
    "Clasp your hands together in Anjali Mudra (prayer position) and lengthen your body upward.",
    "Hold the pose, breathing steadily. When ready, exhale and return to mountain pose to switch legs.",
  ],
  Cobra: [
    "Lie prone on the floor. Stretch your legs back, tops of feet on the floor. Place hands under shoulders, elbows hugged in.",
    "Inhale and begin straightening arms to lift your chest. Maintain connection through your pubis to your legs.",
    "Firm shoulder blades against the back, lift through the sternum. Distribute the backbend evenly through the spine.",
    "Hold for 15-30 seconds, breathing easily. Exhale and release back to the floor.",
  ],
  Dog: [
    "Come onto hands and knees. Hands slightly ahead of shoulders, knees below hips. Spread palms and turn toes under.",
    "Exhale, lift knees from floor. Keep knees slightly bent, heels lifted. Lengthen tailbone toward the ceiling.",
    "Push top thighs back, stretch heels toward floor. Straighten knees without locking them.",
    "Firm outer arms, press index finger bases into floor. Keep head between upper arms. Hold for 10+ breaths.",
  ],
  Chair: [
    "Stand tall with feet slightly wider than hip-width, arms at sides.",
    "Inhale, lift arms next to ears — straight, parallel, fingers long. Keep shoulders down, spine neutral.",
    "Exhale, bend knees keeping thighs parallel. Lean torso forward to create a right angle. Hold 30-60 seconds.",
  ],
  Warrior: [
    "Begin in lunge with front knee bent, back leg straight, heel lifted. Square hips and chest to front. Raise arms overhead.",
    "Move hands to heart in prayer. Lean forward until back leg extends straight, even with hips. Foot flexed, gaze down.",
    "Ensure standing leg is strong and straight. Reach arms forward — body forms a 'T' shape.",
  ],
  Traingle: [
    "Stand with feet 3-4 feet apart. Turn left foot out, face that direction. Slight bend in left leg, arms in a 'T'.",
    "Straighten left leg, hinge torso over it. Rotate left palm upward, gaze over left arm.",
    "Reach left hand to mat in front of left foot. Extend right arm overhead. Hold and repeat on other side.",
  ],
  Shoulderstand: [
    "Lie down with shoulders on folded blankets. Set up as for bridge pose. Walk shoulders under upper back.",
    "Lift hips into bridge, extend arms down. Press palms for leverage, extend one leg up, then the other. Place hands on low back.",
    "Keep gaze upward, neck straight — never turn your head. Lift through balls of feet.",
    "Align hips over shoulders, feet over hips. Stay for up to 10 breaths.",
  ],
};
