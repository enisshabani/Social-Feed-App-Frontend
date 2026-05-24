const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 80;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
  })
);

app.use(
  "/uploads",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
  })
);

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}, proxying API to ${BACKEND_URL}`);
});
