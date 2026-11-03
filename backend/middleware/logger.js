export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode < 400 ? "✅" : statusCode < 500 ? "⚠️" : "❌";
    console.log(`[HTTP] ${statusEmoji} ${method} ${originalUrl} -> ${statusCode} (${duration}ms)`);
  });

  next();
}
