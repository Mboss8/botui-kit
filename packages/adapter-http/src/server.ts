import Fastify, { type FastifyInstance } from 'fastify';
import { render, type RenderOptions } from '@botui/runtime';

export type BotUIHttpServerOptions = {
  logger?: boolean;
  renderOptions?: RenderOptions;
};

export function buildServer(options: BotUIHttpServerOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });
  const renderOptions = options.renderOptions ?? {};

  app.get('/healthz', async () => {
    return { status: 'ok', service: 'botui' };
  });

  app.post('/v1/render', async (request, reply) => {
    try {
      return render(request.body, renderOptions);
    } catch {
      return reply.code(400).send({
        error: {
          code: 'INVALID_RENDER_REQUEST',
          message: 'Invalid BotUI render request'
        }
      });
    }
  });

  return app;
}
