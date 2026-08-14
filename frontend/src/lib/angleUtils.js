/**
 * Joint angle computation from MoveNet keypoints.
 * All angles in degrees.
 */
import { KEYPOINTS } from './constants';

/**
 * Angle at point B formed by points A → B → C (in degrees).
 */
export function angleBetween3Points(a, b, c) {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

  if (magBA < 1e-8 || magBC < 1e-8) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/**
 * Angle of line p1→p2 relative to horizontal or vertical axis.
 */
export function angleToAxis(p1, p2, axis = 'horizontal') {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  if (axis === 'horizontal') {
    return (Math.atan2(Math.abs(dy), Math.abs(dx) + 1e-8) * 180) / Math.PI;
  }
  // vertical
  return (Math.atan2(Math.abs(dx), Math.abs(dy) + 1e-8) * 180) / Math.PI;
}

/**
 * Compute all 7 joint angles from MoveNet keypoints array.
 * keypoints: array of { x, y, score, name } from pose-detection.
 */
export function computeAllAngles(keypoints) {
  const kp = (idx) => ({ x: keypoints[idx].x, y: keypoints[idx].y });

  return {
    left_knee_angle: angleBetween3Points(
      kp(KEYPOINTS.LEFT_HIP), kp(KEYPOINTS.LEFT_KNEE), kp(KEYPOINTS.LEFT_ANKLE)
    ),
    right_knee_angle: angleBetween3Points(
      kp(KEYPOINTS.RIGHT_HIP), kp(KEYPOINTS.RIGHT_KNEE), kp(KEYPOINTS.RIGHT_ANKLE)
    ),
    left_elbow_angle: angleBetween3Points(
      kp(KEYPOINTS.LEFT_SHOULDER), kp(KEYPOINTS.LEFT_ELBOW), kp(KEYPOINTS.LEFT_WRIST)
    ),
    right_elbow_angle: angleBetween3Points(
      kp(KEYPOINTS.RIGHT_SHOULDER), kp(KEYPOINTS.RIGHT_ELBOW), kp(KEYPOINTS.RIGHT_WRIST)
    ),
    hip_alignment: angleToAxis(
      kp(KEYPOINTS.LEFT_HIP), kp(KEYPOINTS.RIGHT_HIP), 'horizontal'
    ),
    spine_tilt: angleToAxis(
      kp(KEYPOINTS.LEFT_SHOULDER), kp(KEYPOINTS.LEFT_HIP), 'vertical'
    ),
    shoulder_alignment: angleToAxis(
      kp(KEYPOINTS.LEFT_SHOULDER), kp(KEYPOINTS.RIGHT_SHOULDER), 'horizontal'
    ),
  };
}

/**
 * Normalize 17 keypoints to 34-value array (same as training).
 * Center at hip midpoint, scale by pose size.
 */
export function normalizeKeypoints(keypoints) {
  const lh = keypoints[KEYPOINTS.LEFT_HIP];
  const rh = keypoints[KEYPOINTS.RIGHT_HIP];
  const cx = (lh.x + rh.x) / 2;
  const cy = (lh.y + rh.y) / 2;

  // Center all
  const centered = keypoints.map(kp => ({
    x: kp.x - cx,
    y: kp.y - cy,
  }));

  // Torso size
  const ls = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rs = keypoints[KEYPOINTS.RIGHT_SHOULDER];
  const scx = (ls.x + rs.x) / 2;
  const scy = (ls.y + rs.y) / 2;
  const torso = Math.sqrt((scx - cx) ** 2 + (scy - cy) ** 2);

  // Max distance from center
  let maxD = 0;
  for (const pt of centered) {
    const d = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
    if (d > maxD) maxD = d;
  }

  const poseSize = Math.max(torso * 2.5, maxD);
  if (poseSize < 1e-6) return null;

  const result = [];
  for (const pt of centered) {
    result.push(pt.x / poseSize, pt.y / poseSize);
  }
  return result; // 34 values
}
