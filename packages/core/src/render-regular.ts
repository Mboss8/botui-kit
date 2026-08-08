import type { BotUIRenderRequest } from '@botui/schema';
import { interpolate } from './template.js';
import { createFallbackTextResolver, type TextResolver } from './text.js';

export type RenderedContent = {
  format: 'html';
  text: string;
};

export type RenderRegularOptions = {
  resolveText?: TextResolver;
  divider?: string;
};

export function renderRegular(
  request: BotUIRenderRequest,
  options: RenderRegularOptions = {}
): RenderedContent {
  const { content, data } = request;
  const resolveText = options.resolveText ?? createFallbackTextResolver();
  const blocks: string[] = [];

  if (content.title) {
    blocks.push(`<b>${interpolate(resolveText(content.title), data)}</b>`);
  }

  if (content.text) {
    blocks.push(interpolate(resolveText(content.text), data));
  }

  for (const field of content.fields) {
    blocks.push(
      `<b>${interpolate(resolveText(field.label), data)}</b>\n${interpolate(resolveText(field.value), data)}`
    );
  }

  if (content.divider) {
    blocks.push(options.divider ?? '──────────');
  }

  if (content.footer) {
    blocks.push(interpolate(resolveText(content.footer), data));
  }

  return {
    format: 'html',
    text: blocks.join('\n\n').trim()
  };
}
