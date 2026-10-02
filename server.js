// ============================================================
// LOCAL DEV SERVER
// Responsibility:
// - Serve this project over http://localhost (no dependencies)
// - The app uses ES modules (type="module") + Firebase, which
//   browsers block when opened via file:// (double click).
//   Always run the app through this server.
//
// Usage:
//   node server.js          -> http://localhost:5173
//   node server.js 8080     -> http://localhost:8080
// ============================================================

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5173;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".txt": "text/plain; charset=utf-8",
    ".map": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {

    let urlPath;

    try {
        urlPath = decodeURIComponent(request.url.split("?")[0]);
    } catch (error) {
        response.writeHead(400);
        return response.end("Bad request");
    }

    if (urlPath.endsWith("/")) {
        urlPath += "index.html";
    }

    const filePath = path.join(ROOT, urlPath);

    // Prevent path traversal outside the project folder
    if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
        response.writeHead(403);
        return response.end("Forbidden");
    }

    fs.readFile(filePath, (error, data) => {

        if (error) {

            response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            return response.end("404 — Not found: " + urlPath);

        }

        const contentType =
            MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";

        response.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "no-store",
        });

        response.end(data);

    });

});

server.listen(PORT, () => {

    const url = "http://localhost:" + PORT;

    console.log("=================================================");
    console.log("  Saylani Mini Hackathon — local server running");
    console.log("  Open: " + url);
    console.log("  (Ctrl + C to stop)");
    console.log("=================================================");

    // Open the default browser on first start
    const command =
        process.platform === "win32"
            ? `start "" "${url}"`
            : process.platform === "darwin"
                ? `open "${url}"`
                : `xdg-open "${url}"`;

    exec(command, () => {});

});
