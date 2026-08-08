import { buildServer } from '../../packages/adapter-http/dist/index.js';

const host = process.env.BOTUI_HOST ?? '127.0.0.1';
const port = Number(process.env.BOTUI_PORT ?? '8787');

const app = buildServer({ logger: true });
await app.listen({ host, port });
