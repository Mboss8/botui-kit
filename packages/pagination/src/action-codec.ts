import { Buffer } from 'node:buffer';

export type PaginationOp = 'f' | 'p' | 'n' | 'l' | 'r';

export type ActionRef = {
  version: 'v1';
  domain: 'p';
  session: string;
  op: PaginationOp;
};

const OPS = new Set<PaginationOp>(['f', 'p', 'n', 'l', 'r']);

function validate(ref: ActionRef): void {
  if (ref.version !== 'v1' || ref.domain !== 'p') {
    throw new Error('unsupported action protocol');
  }
  if (!ref.session || ref.session.includes(':')) {
    throw new Error('invalid action session');
  }
  if (!OPS.has(ref.op)) {
    throw new Error('invalid pagination operation');
  }
}

export function encodeAction(ref: ActionRef): string {
  validate(ref);
  const token = `${ref.version}:${ref.domain}:${ref.session}:${ref.op}`;
  if (Buffer.byteLength(token, 'utf8') > 64) {
    throw new Error('Telegram callback_data exceeds 64 UTF-8 bytes');
  }
  return token;
}

export function decodeAction(token: string): ActionRef {
  if (Buffer.byteLength(token, 'utf8') > 64) {
    throw new Error('Telegram callback_data exceeds 64 UTF-8 bytes');
  }

  const parts = token.split(':');
  if (parts.length !== 4) {
    throw new Error('invalid action token');
  }

  const [version, domain, session, op] = parts;
  if (version !== 'v1' || domain !== 'p' || !session || !OPS.has(op as PaginationOp)) {
    throw new Error('invalid action token');
  }

  return {
    version,
    domain,
    session,
    op: op as PaginationOp
  };
}
