FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --production

COPY src ./src

# Default to running email worker, override with docker command
CMD ["bun", "src/email-worker.ts"]
