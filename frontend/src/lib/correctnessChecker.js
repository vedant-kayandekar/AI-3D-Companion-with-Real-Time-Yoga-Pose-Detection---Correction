/**
 * Rule-based correctness checker using angle references.
 * Compares user's joint angles to the reference data.
 * No ML model needed — pure math.
 */

let angleReference = null;
let feedbackTemplates = null;

/**
 * Load angle reference data.
 */
export async function initCorrectnessChecker() {
  try {
    const resp = await fetch('/models/angle_reference.json');
    if (resp.ok) {
      const data = await resp.json();
      angleReference = data.angle_reference || {};
      feedbackTemplates = data.angle_feedback_templates || {};
      console.log('[Correctness] Angle reference loaded:', Object.keys(angleReference).length, 'entries');
    }
  } catch (err) {
    console.warn('[Correctness] Angle reference not found — using defaults.', err.message);
  }
}

// ── Default angle references (hardcoded fallback before training) ────
const DEFAULT_REFS = {
  Tadasana: {
    left_knee_angle: { mean: 175, std: 8 },
    right_knee_angle: { mean: 175, std: 8 },
    left_elbow_angle: { mean: 170, std: 15 },
    right_elbow_angle: { mean: 170, std: 15 },
    hip_alignment: { mean: 5, std: 4 },
    spine_tilt: { mean: 5, std: 4 },
    shoulder_alignment: { mean: 5, std: 4 },
  },
  Bhujangasana: {
    left_knee_angle: { mean: 175, std: 8 },
    right_knee_angle: { mean: 175, std: 8 },
    left_elbow_angle: { mean: 140, std: 20 },
    right_elbow_angle: { mean: 140, std: 20 },
    hip_alignment: { mean: 5, std: 5 },
    spine_tilt: { mean: 30, std: 12 },
    shoulder_alignment: { mean: 8, std: 5 },
  },
  Parvatasana: {
    left_knee_angle: { mean: 170, std: 10 },
    right_knee_angle: { mean: 170, std: 10 },
    left_elbow_angle: { mean: 170, std: 12 },
    right_elbow_angle: { mean: 170, std: 12 },
    hip_alignment: { mean: 5, std: 4 },
    spine_tilt: { mean: 8, std: 5 },
    shoulder_alignment: { mean: 5, std: 4 },
  },
};

// ── Human-readable feedback generators ──────────────────────────────
const FEEDBACK_GENERATORS = {
  left_knee_angle: (userVal, ref) => {
    if (userVal > ref.mean + ref.std * 1.5) return `Straighten your left knee more. Target: ~${ref.mean.toFixed(0)}° (yours: ${userVal.toFixed(0)}°)`;
    if (userVal < ref.mean - ref.std * 1.5) return `Bend your left knee less. Target: ~${ref.mean.toFixed(0)}° (yours: ${userVal.toFixed(0)}°)`;
    return null;
  },
  right_knee_angle: (userVal, ref) => {
    if (userVal > ref.mean + ref.std * 1.5) return `Straighten your right knee more. Target: ~${ref.mean.toFixed(0)}° (yours: ${userVal.toFixed(0)}°)`;
    if (userVal < ref.mean - ref.std * 1.5) return `Bend your right knee less. Target: ~${ref.mean.toFixed(0)}° (yours: ${userVal.toFixed(0)}°)`;
    return null;
  },
  left_elbow_angle: (userVal, ref) => {
    if (userVal > ref.mean + ref.std * 1.5) return `Extend your left arm more. Target: ~${ref.mean.toFixed(0)}° (yours: ${userVal.toFixed(0)}°)`;
    if (userVal < ref.mean - ref.std * 1.5) return `Bend your left arm slightly. Target: ~${ref.mean.toFixed(0)}° (yours: ${userVal.toFixed(0)}°)`;
    return null;
  },
  right_elbow_angle: (userVal, ref) => {
    if (userVal > ref.mean + ref.std * 1.5) return `Extend your right arm more. Target: ~${ref.mean.toFixed(0)}° (yours: ${userVal.toFixed(0)}°)`;
    if (userVal < ref.mean - ref.std * 1.5) return `Bend your right arm slightly. Target: ~${ref.mean.toFixed(0)}° (yours: ${userVal.toFixed(0)}°)`;
    return null;
  },
  hip_alignment: (userVal, ref) => {
    if (Math.abs(userVal - ref.mean) > ref.std * 1.5) return `Your hips are uneven by ${Math.abs(userVal - ref.mean).toFixed(0)}°. Try to level them.`;
    return null;
  },
  spine_tilt: (userVal, ref) => {
    if (Math.abs(userVal - ref.mean) > ref.std * 1.5) return `Your spine is tilted ${Math.abs(userVal - ref.mean).toFixed(0)}° off. Align your torso.`;
    return null;
  },
  shoulder_alignment: (userVal, ref) => {
    if (Math.abs(userVal - ref.mean) > ref.std * 1.5) return `Your shoulders are uneven by ${Math.abs(userVal - ref.mean).toFixed(0)}°. Level them.`;
    return null;
  },
};

/**
 * Check correctness of a pose based on joint angles.
 *
 * @param {string} poseName - e.g., "Tadasana"
 * @param {number} stepNumber - e.g., 1
 * @param {Object} userAngles - { left_knee_angle: 170, ... }
 * @returns {{ isCorrect: boolean, confidence: number, feedback: string[], offAngles: string[] }}
 */
export function checkCorrectness(poseName, stepNumber, userAngles) {
  if (!userAngles) {
    return { isCorrect: false, confidence: 0, feedback: ['Unable to compute angles.'], offAngles: [] };
  }

  // Try specific step reference first, then pose-level, then default
  const stepKey = `${poseName}_Step${stepNumber}`;
  const ref = angleReference?.[stepKey] || angleReference?.[poseName] || DEFAULT_REFS[poseName];

  if (!ref) {
    return {
      isCorrect: true,
      confidence: 0.5,
      feedback: ['No reference data for this pose yet. Train models for accurate feedback.'],
      offAngles: [],
    };
  }

  const feedback = [];
  const offAngles = [];
  let totalAngles = 0;
  let correctAngles = 0;

  for (const [angleName, generator] of Object.entries(FEEDBACK_GENERATORS)) {
    const refData = ref[angleName];
    const userVal = userAngles[angleName];

    if (refData == null || userVal == null) continue;
    totalAngles++;

    const msg = generator(userVal, refData);
    if (msg) {
      feedback.push(msg);
      offAngles.push(angleName);
    } else {
      correctAngles++;
    }
  }

  const confidence = totalAngles > 0 ? correctAngles / totalAngles : 0.5;
  const isCorrect = feedback.length === 0;

  if (!isCorrect && feedback.length === 0) {
    feedback.push('Overall form needs adjustment. Check your full body alignment.');
  }

  return { isCorrect, confidence, feedback, offAngles };
}

/**
 * Check if angle reference data is loaded.
 */
export function isReferenceReady() {
  return angleReference !== null;
}
