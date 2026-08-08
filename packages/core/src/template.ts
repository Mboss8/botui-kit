import { escapeTelegramHtml } from './html.js';

function resolvePath(data: Record<string, unknown>, path: string): unknown {
  let current: unknown = data;

  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') {
      return '';
    }

    const record = current as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(record, segment)) {
      return '';
    }

    current = record[segment];
  }

  return current;
}

export function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_match, path: string) => {
    return escapeTelegramHtml(resolvePath(data, path));
  });
}
