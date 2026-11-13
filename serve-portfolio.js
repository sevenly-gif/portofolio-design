const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT) || 8769;
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".mp4": "video/mp4",
    ".png": "image/png"
};

const server = http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end();
        return;
    }

    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
        response.writeHead(400);
        response.end("Invalid URL");
        return;
    }

    if (pathname === "/__portfolio_health") {
        response.writeHead(200, {
            "Cache-Control": "no-store",
            "Content-Type": "application/json; charset=utf-8"
        });
        response.end(JSON.stringify({ service: "hegel-prayoga-portfolio" }));
        return;
    }

    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.resolve(root, `.${requestedPath}`);
    const relativePath = path.relative(root, filePath);
    if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.stat(filePath, (statError, fileStats) => {
        if (statError || !fileStats.isFile()) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        const headers = {
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache",
            "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
        };
        const range = request.headers.range;

        if (range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(range);
            if (!match || (!match[1] && !match[2])) {
                response.writeHead(416, { "Content-Range": `bytes */${fileStats.size}` });
                response.end();
                return;
            }

            const start = match[1]
                ? Number(match[1])
                : Math.max(0, fileStats.size - Number(match[2]));
            const end = match[2] && match[1]
                ? Math.min(Number(match[2]), fileStats.size - 1)
                : fileStats.size - 1;

            if (start >= fileStats.size || end < start) {
                response.writeHead(416, { "Content-Range": `bytes */${fileStats.size}` });
                response.end();
                return;
            }

            headers["Content-Length"] = end - start + 1;
            headers["Content-Range"] = `bytes ${start}-${end}/${fileStats.size}`;
            response.writeHead(206, headers);
            if (request.method === "HEAD") {
                response.end();
                return;
            }

            const stream = fs.createReadStream(filePath, { start, end });
            stream.on("error", () => response.destroy());
            stream.pipe(response);
            return;
        }

        headers["Content-Length"] = fileStats.size;
        response.writeHead(200, headers);
        if (request.method === "HEAD") {
            response.end();
            return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on("error", () => response.destroy());
        stream.pipe(response);
    });
});

server.on("error", (error) => {
    console.error(`Could not start the portfolio server: ${error.message}`);
    process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Portfolio ready at http://127.0.0.1:${port}/`);
    console.log("Keep this window open while viewing the portfolio.");
});
