/**
 * Pose + Step classifier using exported sklearn MLP weights.
 * Runs forward pass in pure JavaScript — no TF.js model needed.
 */

let modelData = null;  // { layers, activations, scaler, classes }
let labelMapping = null;

// ── Matrix math helpers ─────────────────────────────────────────────
function matMulAddBias(input, weights, biases) {
  // input: [inputDim], weights: [inputDim][outputDim], biases: [outputDim]
  const outputDim = biases.length;
  const result = new Float32Array(outputDim);
  for (let j = 0; j < outputDim; j++) {
    let sum = biases[j];
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * weights[i][j];
    }
    result[j] = sum;
  }
  return result;
}

function relu(arr) {
  return arr.map(v => Math.max(0, v));
}

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

function standardScale(input, mean, scale) {
  return input.map((v, i) => (v - mean[i]) / (scale[i] + 1e-10));
}

// ── Forward pass ────────────────────────────────────────────────────
function forwardPass(input) {
  if (!modelData) return null;

  // 1. Standardize
  let x = standardScale(input, modelData.scaler.mean, modelData.scaler.scale);

  // 2. Pass through layers
  for (let i = 0; i < modelData.layers.length; i++) {
    const { weights, biases } = modelData.layers[i];
    x = matMulAddBias(x, weights, biases);

    const activation = modelData.activations[i];
    if (activation === 'relu') {
      x = relu(x);
    } else if (activation === 'softmax') {
      x = softmax(x);
    }
  }

  return x; // probabilities
}

/**
 * Load the pose classifier model weights and label mapping.
 */
export async function initPoseClassifier() {
  try {
    // Load model weights JSON
    const resp = await fetch('/models/pose_classifier/model_weights.json');
    if (resp.ok) {
      modelData = await resp.json();
      console.log('[PoseClassifier] Model weights loaded:', modelData.classes?.length, 'classes');
    } else {
      console.warn('[PoseClassifier] model_weights.json not found (404). Train models first.');
    }

    // Load label mapping
    const resp2 = await fetch('/models/label_mapping.json');
    if (resp2.ok) {
      labelMapping = await resp2.json();
      console.log('[PoseClassifier] Label mapping loaded');
    }
  } catch (err) {
    console.warn('[PoseClassifier] Could not load model:', err.message);
    modelData = null;
    labelMapping = null;
  }
}

/**
 * Classify the pose from normalized keypoints.
 * @param {number[]} normalizedKps - 34-value array (x,y × 17)
 * @returns {{ className: string, poseName: string, stepNumber: number, confidence: number } | null}
 */
export function classifyPose(normalizedKps) {
  if (!modelData || !normalizedKps) return null;

  const probs = forwardPass(Array.from(normalizedKps));
  if (!probs) return null;

  // Find top prediction
  let maxIdx = 0;
  let maxProb = 0;
  for (let i = 0; i < probs.length; i++) {
    if (probs[i] > maxProb) {
      maxProb = probs[i];
      maxIdx = i;
    }
  }

  const className = modelData.classes[maxIdx];
  if (!className) return null;

  // Parse "PoseName_StepN" format
  const parts = className.split('_Step');
  const poseName = parts[0] || className;
  const stepNumber = parts.length > 1 ? parseInt(parts[1], 10) : 1;

  return {
    className,
    poseName,
    stepNumber,
    confidence: maxProb,
  };
}

/**
 * Get the label mapping data.
 */
export function getLabelMapping() {
  return labelMapping;
}

/**
 * Check if the classifier is loaded and ready.
 */
export function isClassifierReady() {
  return modelData !== null;
}
