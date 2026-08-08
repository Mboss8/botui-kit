import type {
  BotUIRenderRequest,
  BotUIRichBlock,
  BotUIRichTableCell,
  LocalizedText
} from '@botui/schema';
import { interpolatePlain } from './template.js';
import { createFallbackTextResolver, type TextResolver } from './text.js';

const TELEGRAM_RICH_TEXT_LIMIT = 32768;

export type TelegramNeutralRichTableCell = {
  text: string;
  is_header?: true;
  colspan?: number;
  rowspan?: number;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
};

export type TelegramNeutralRichListItem = {
  blocks: TelegramNeutralRichBlock[];
  has_checkbox?: true;
  is_checked?: true;
  value?: number;
  type?: 'a' | 'A' | 'i' | 'I' | '1';
};

export type TelegramNeutralRichBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; size: number }
  | { type: 'pre'; text: string; language?: string }
  | { type: 'footer'; text: string }
  | { type: 'divider' }
  | { type: 'blockquote'; blocks: TelegramNeutralRichBlock[]; credit?: string }
  | { type: 'list'; items: TelegramNeutralRichListItem[] }
  | {
      type: 'table';
      cells: TelegramNeutralRichTableCell[][];
      is_bordered?: true;
      is_striped?: true;
      caption?: string;
    }
  | {
      type: 'details';
      summary: string;
      blocks: TelegramNeutralRichBlock[];
      is_open?: true;
    };

export type RenderedRichContent = {
  format: 'rich';
  richMessage: {
    blocks: TelegramNeutralRichBlock[];
    is_rtl?: true;
  };
};

export type RichHeadingSize = 1 | 2 | 3 | 4 | 5 | 6;

export type RenderRichOptions = {
  resolveText?: TextResolver;
  defaultHeadingSize?: RichHeadingSize;
};

type RichContext = {
  data: Record<string, unknown>;
  resolveText: TextResolver;
  defaultHeadingSize: RichHeadingSize;
};

function resolveRichText(value: LocalizedText, context: RichContext): string {
  return interpolatePlain(context.resolveText(value), context.data);
}

function mapTableCell(
  cell: BotUIRichTableCell,
  context: RichContext
): TelegramNeutralRichTableCell {
  const mapped: TelegramNeutralRichTableCell = {
    text: resolveRichText(cell.text, context)
  };

  if (cell.header) mapped.is_header = true;
  if (cell.colspan !== undefined && cell.colspan > 1) mapped.colspan = cell.colspan;
  if (cell.rowspan !== undefined && cell.rowspan > 1) mapped.rowspan = cell.rowspan;
  if (cell.align !== undefined) mapped.align = cell.align;
  if (cell.valign !== undefined) mapped.valign = cell.valign;

  return mapped;
}

function mapBlock(block: BotUIRichBlock, context: RichContext): TelegramNeutralRichBlock {
  switch (block.type) {
    case 'heading':
      return {
        type: 'heading',
        text: resolveRichText(block.text, context),
        size: block.size ?? context.defaultHeadingSize
      };

    case 'paragraph':
      return {
        type: 'paragraph',
        text: resolveRichText(block.text, context)
      };

    case 'preformatted': {
      const mapped: TelegramNeutralRichBlock = {
        type: 'pre',
        text: resolveRichText(block.text, context)
      };
      if (block.language !== undefined) mapped.language = block.language;
      return mapped;
    }

    case 'footer':
      return {
        type: 'footer',
        text: resolveRichText(block.text, context)
      };

    case 'divider':
      return { type: 'divider' };

    case 'quote': {
      const mapped: Extract<TelegramNeutralRichBlock, { type: 'blockquote' }> = {
        type: 'blockquote',
        blocks: block.blocks.map((child) => mapBlock(child, context))
      };
      if (block.credit !== undefined) {
        mapped.credit = resolveRichText(block.credit, context);
      }
      return mapped;
    }

    case 'list': {
      const items = block.items.map((item, index): TelegramNeutralRichListItem => {
        const mapped: TelegramNeutralRichListItem = {
          blocks: [{
            type: 'paragraph',
            text: resolveRichText(item.text, context)
          }]
        };

        if (item.checked !== undefined) {
          mapped.has_checkbox = true;
          if (item.checked) mapped.is_checked = true;
        }

        if (block.ordered) {
          mapped.value = item.value ?? index + 1;
          mapped.type = '1';
        }

        return mapped;
      });

      return { type: 'list', items };
    }

    case 'table': {
      const mapped: Extract<TelegramNeutralRichBlock, { type: 'table' }> = {
        type: 'table',
        cells: block.rows.map((row) => row.map((cell) => mapTableCell(cell, context)))
      };

      if (block.bordered) mapped.is_bordered = true;
      if (block.striped) mapped.is_striped = true;
      if (block.caption !== undefined) {
        mapped.caption = resolveRichText(block.caption, context);
      }

      return mapped;
    }

    case 'details': {
      const mapped: Extract<TelegramNeutralRichBlock, { type: 'details' }> = {
        type: 'details',
        summary: resolveRichText(block.summary, context),
        blocks: block.blocks.map((child) => mapBlock(child, context))
      };

      if (block.open) mapped.is_open = true;
      return mapped;
    }
  }
}

function characterCount(value: string): number {
  return Array.from(value).length;
}

function countRichTextCharacters(block: TelegramNeutralRichBlock): number {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'pre':
    case 'footer':
      return characterCount(block.text);

    case 'divider':
      return 0;

    case 'blockquote':
      return (block.credit ? characterCount(block.credit) : 0)
        + block.blocks.reduce((total, child) => total + countRichTextCharacters(child), 0);

    case 'list':
      return block.items.reduce(
        (total, item) => total + item.blocks.reduce(
          (itemTotal, child) => itemTotal + countRichTextCharacters(child),
          0
        ),
        0
      );

    case 'table':
      return (block.caption ? characterCount(block.caption) : 0)
        + block.cells.reduce(
          (total, row) => total + row.reduce(
            (rowTotal, cell) => rowTotal + characterCount(cell.text),
            0
          ),
          0
        );

    case 'details':
      return characterCount(block.summary)
        + block.blocks.reduce((total, child) => total + countRichTextCharacters(child), 0);
  }
}

export function renderRich(
  request: BotUIRenderRequest,
  options: RenderRichOptions = {}
): RenderedRichContent {
  const context: RichContext = {
    data: request.data,
    resolveText: options.resolveText ?? createFallbackTextResolver(),
    defaultHeadingSize: options.defaultHeadingSize ?? 2
  };

  const blocks = (request.content.blocks ?? []).map((block) => mapBlock(block, context));
  const totalCharacters = blocks.reduce(
    (total, block) => total + countRichTextCharacters(block),
    0
  );

  if (totalCharacters > TELEGRAM_RICH_TEXT_LIMIT) {
    throw new Error(`Rich Message text exceeds Telegram ${TELEGRAM_RICH_TEXT_LIMIT}-character limit`);
  }

  const richMessage: RenderedRichContent['richMessage'] = { blocks };

  if (request.content.is_rtl) {
    richMessage.is_rtl = true;
  }

  return {
    format: 'rich',
    richMessage
  };
}
