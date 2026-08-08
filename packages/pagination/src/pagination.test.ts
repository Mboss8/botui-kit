import { describe, expect, it } from 'vitest';
import { decodeAction, encodeAction } from './action-codec.js';
import { buildCursorControls } from './cursor.js';
import { buildPageControls } from './page.js';

describe('pagination action codec', () => {
  it('round-trips a compact pagination action', () => {
    const token = encodeAction({ version: 'v1', domain: 'p', session: 'ORD8K2', op: 'n' });
    expect(token).toBe('v1:p:ORD8K2:n');
    expect(decodeAction(token)).toEqual({ version: 'v1', domain: 'p', session: 'ORD8K2', op: 'n' });
  });

  it('rejects callback data longer than 64 UTF-8 bytes', () => {
    expect(() => encodeAction({
      version: 'v1',
      domain: 'p',
      session: '页'.repeat(30),
      op: 'n'
    })).toThrow(/64/);
  });
});

describe('page pagination controls', () => {
  it('omits impossible backward actions on the first page', () => {
    const controls = buildPageControls({ session: 'ORD', page: 1, totalPages: 5 });
    expect(controls.map((item) => item.text)).toEqual(['1/5', '▶️', '⏭']);
  });

  it('renders full navigation on a middle page', () => {
    const controls = buildPageControls({ session: 'ORD', page: 3, totalPages: 5 });
    expect(controls.map((item) => item.text)).toEqual(['⏮', '◀️', '3/5', '▶️', '⏭']);
  });

  it('omits impossible forward actions on the last page', () => {
    const controls = buildPageControls({ session: 'ORD', page: 5, totalPages: 5 });
    expect(controls.map((item) => item.text)).toEqual(['⏮', '◀️', '5/5']);
  });
});

describe('cursor pagination controls', () => {
  it('emits only available cursor directions with a refresh control', () => {
    const controls = buildCursorControls({
      session: 'LOG',
      hasPrev: false,
      hasNext: true
    });

    expect(controls.map((item) => item.text)).toEqual(['↻', '▶️']);
  });
});
