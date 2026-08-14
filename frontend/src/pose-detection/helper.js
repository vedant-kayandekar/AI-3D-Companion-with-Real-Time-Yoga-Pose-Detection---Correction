/**
 * Draw a point (keypoint) on the canvas
 */
export function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draw a line segment between two keypoints
 */
export function drawSegment(ctx, [mx, my], [tx, ty], color) {
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(tx, ty);
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
}
