FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --production

COPY src ./src

ENV PORT=3002
EXPOSE 3002

CMD ["bun", "src/index.ts"]
