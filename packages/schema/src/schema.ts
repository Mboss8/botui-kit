import { z } from 'zod';

export const renderModeSchema = z.enum(['auto', 'regular', 'rich', 'media', 'miniapp']);
export const buttonStyleSchema = z.enum(['primary', 'success', 'danger', 'default']);

export const localizedTextSchema = z.union([
  z.string(),
  z.object({
    i18n: z.string().min(1),
    fallback: z.string().optional()
  }).strict()
]);

export type LocalizedText = z.infer<typeof localizedTextSchema>;

export type BotUIRichTableCell = {
  text: LocalizedText;
  header?: boolean;
  colspan?: number;
  rowspan?: number;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
};

export type BotUIRichListItem = {
  text: LocalizedText;
  checked?: boolean;
  value?: number;
};

export type BotUIRichBlock =
  | { type: 'heading'; text: LocalizedText; size?: number }
  | { type: 'paragraph'; text: LocalizedText }
  | { type: 'preformatted'; text: LocalizedText; language?: string }
  | { type: 'footer'; text: LocalizedText }
  | { type: 'divider' }
  | { type: 'quote'; blocks: BotUIRichBlock[]; credit?: LocalizedText }
  | { type: 'list'; ordered?: boolean; items: BotUIRichListItem[] }
  | {
      type: 'table';
      rows: BotUIRichTableCell[][];
      bordered?: boolean;
      striped?: boolean;
      caption?: LocalizedText;
    }
  | { type: 'details'; summary: LocalizedText; blocks: BotUIRichBlock[]; open?: boolean };

const tableCellSchema: z.ZodType<BotUIRichTableCell> = z.object({
  text: localizedTextSchema,
  header: z.boolean().optional(),
  colspan: z.number().int().min(1).max(20).optional(),
  rowspan: z.number().int().min(1).max(100).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  valign: z.enum(['top', 'middle', 'bottom']).optional()
});

const listItemSchema: z.ZodType<BotUIRichListItem> = z.object({
  text: localizedTextSchema,
  checked: z.boolean().optional(),
  value: z.number().int().positive().optional()
});

export const richBlockSchema: z.ZodType<BotUIRichBlock> = z.lazy(() => z.union([
  z.object({
    type: z.literal('heading'),
    text: localizedTextSchema,
    size: z.number().int().min(1).max(6).optional()
  }),
  z.object({
    type: z.literal('paragraph'),
    text: localizedTextSchema
  }),
  z.object({
    type: z.literal('preformatted'),
    text: localizedTextSchema,
    language: z.string().min(1).optional()
  }),
  z.object({
    type: z.literal('footer'),
    text: localizedTextSchema
  }),
  z.object({ type: z.literal('divider') }),
  z.object({
    type: z.literal('quote'),
    blocks: z.array(richBlockSchema).min(1).max(100),
    credit: localizedTextSchema.optional()
  }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean().default(false),
    items: z.array(listItemSchema).min(1).max(100)
  }),
  z.object({
    type: z.literal('table'),
    rows: z.array(z.array(tableCellSchema).min(1).max(20)).min(1).max(100),
    bordered: z.boolean().optional(),
    striped: z.boolean().optional(),
    caption: localizedTextSchema.optional()
  }),
  z.object({
    type: z.literal('details'),
    summary: localizedTextSchema,
    blocks: z.array(richBlockSchema).min(1).max(100),
    open: z.boolean().optional()
  })
]));

export const buttonSchema = z.object({
  text: localizedTextSchema,
  action: z.string().min(1),
  style: buttonStyleSchema.default('default'),
  url: z.string().url().optional(),
  priority: z.number().int().optional()
});

export const contentFieldSchema = z.object({
  label: localizedTextSchema,
  value: localizedTextSchema
});

export const contentSchema = z.object({
  mode: renderModeSchema.default('auto'),
  title: localizedTextSchema.optional(),
  text: localizedTextSchema.optional(),
  fields: z.array(contentFieldSchema).default([]),
  divider: z.boolean().default(false),
  footer: localizedTextSchema.optional(),
  blocks: z.array(richBlockSchema).max(500).optional(),
  is_rtl: z.boolean().optional()
});

export const pagePaginationSchema = z.object({
  mode: z.literal('page'),
  session: z.string().min(1).max(32),
  page: z.number().int().positive(),
  page_size: z.number().int().positive().max(100),
  total_pages: z.number().int().positive(),
  total_items: z.number().int().nonnegative().optional()
}).superRefine((value, ctx) => {
  if (value.page > value.total_pages) {
    ctx.addIssue({
      code: 'custom',
      path: ['page'],
      message: 'page cannot exceed total_pages'
    });
  }
});

export const cursorPaginationSchema = z.object({
  mode: z.literal('cursor'),
  session: z.string().min(1).max(32),
  cursor: z.string().optional(),
  next_cursor: z.string().optional(),
  prev_cursor: z.string().optional(),
  has_next: z.boolean(),
  has_prev: z.boolean(),
  page_size: z.number().int().positive().max(100)
});

export const paginationSchema = z.union([pagePaginationSchema, cursorPaginationSchema]);

export const renderRequestSchema = z.object({
  version: z.literal('1').default('1'),
  screen: z.string().min(1),
  theme: z.string().min(1).default('default'),
  locale: z.string().min(2).default('zh-CN'),
  data: z.record(z.string(), z.unknown()).default({}),
  content: contentSchema,
  actions: z.array(buttonSchema).default([]),
  pagination: paginationSchema.optional()
});

export type BotUIButton = z.infer<typeof buttonSchema>;
export type BotUIContent = z.infer<typeof contentSchema>;
export type PagePagination = z.infer<typeof pagePaginationSchema>;
export type CursorPagination = z.infer<typeof cursorPaginationSchema>;
export type BotUIPagination = z.infer<typeof paginationSchema>;
export type BotUIRenderRequest = z.infer<typeof renderRequestSchema>;
export type BotUIScreen = BotUIRenderRequest;

export function parseRenderRequest(input: unknown): BotUIRenderRequest {
  return renderRequestSchema.parse(input);
}
