import type { BotUIRenderRequest } from '@botui/schema';
import { interpolate } from './template.js';

export type RenderedContent = {
  format: 'html';
  text: string;
};

export function renderRegular(request: BotUIRenderRequest): RenderedContent {
  const { content, data } = request;
  const blocks: string[] = [];

  if (content.title) {
    blocks.push(`<b>${interpolate(content.title, data)}</b>`);
  }

  if (content.text) {
    blocks.push(interpolate(content.text, data));
  }

  for (const field of content.fields) {
    blocks.push(`<b>${interpolate(field.label, data)}</b>\n${interpolate(field.value, data)}`);
  }

  if (content.divider) {
    blocks.push('──────────');
  }

  if (content.footer) {
    blocks.push(interpolate(content.footer, data));
  }

  return {
    format: 'html',
    text: blocks.join('\n\n').trim()
  };
}
