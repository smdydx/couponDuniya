FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --production

COPY src ./src

ENV PORT=3001
EXPOSE 3001

CMD ["bun", "src/index.ts"]
