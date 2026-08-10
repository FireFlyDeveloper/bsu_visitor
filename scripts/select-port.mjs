import net from "node:net";

const start = Number(process.argv[2] || 8000);
const end = Number(process.argv[3] || start + 100);

if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
  console.error("Usage: node scripts/select-port.mjs [start] [end]");
  process.exit(2);
}

const isAvailable = (port) => new Promise((resolve) => {
  const server = net.createServer();
  server.once("error", () => resolve(false));
  server.listen({ host: "127.0.0.1", port }, () => {
    server.close(() => resolve(true));
  });
});

for (let port = start; port <= end; port += 1) {
  if (await isAvailable(port)) {
    console.log(port);
    process.exit(0);
  }
}

console.error(`No available port in range ${start}-${end}`);
process.exit(1);
