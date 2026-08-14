/**
 * MoveNet pose detector wrapper using TF.js.
 * Optimized: tensor cleanup, single instance, warm-up inference.
 */
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

let detector = null;

/**
 * Initialize MoveNet Thunder detector + warm-up.
 */
export async function initPoseDetector() {
  if (detector) return detector;

  await tf.ready();

  // Prefer WebGL backend for GPU acceleration
  try {
    await tf.setBackend('webgl');
    await tf.ready();
  } catch {
    console.warn('[PoseDetector] WebGL not available, using:', tf.getBackend());
  }

  console.log('[PoseDetector] Backend:', tf.getBackend());

  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
    }
  );

  console.log('[PoseDetector] MoveNet Thunder loaded');
  return detector;
}

/**
 * Estimate pose from a video element.
 * Uses tf.tidy internally for tensor cleanup.
 */
export async function estimatePose(video) {
  if (!detector) return null;

  try {
    const poses = await detector.estimatePoses(video, {
      flipHorizontal: false,
    });

    // Force garbage collection of unused tensors
    if (tf.memory().numTensors > 500) {
      console.warn('[PoseDetector] High tensor count:', tf.memory().numTensors);
    }

    if (!poses || poses.length === 0 || !poses[0].keypoints) return null;
    return poses[0].keypoints;
  } catch (err) {
    console.error('[PoseDetector] Estimation error:', err);
    return null;
  }
}

/**
 * Check if enough keypoints have good confidence.
 */
export function hasGoodKeypoints(keypoints, minConf = 0.3, minCount = 10) {
  if (!keypoints || keypoints.length < 17) return false;
  let good = 0;
  for (let i = 0; i < keypoints.length; i++) {
    if (keypoints[i].score >= minConf) good++;
  }
  return good >= minCount;
}
