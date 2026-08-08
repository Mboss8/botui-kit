import { z } from 'zod';

export const renderModeSchema = z.enum(['auto', 'regular', 'rich', 'media', 'miniapp']);
export const buttonStyleSchema = z.enum(['primary', 'success', 'danger', 'default']);

export const buttonSchema = z.object({
  text: z.string().min(1),
  action: z.string().min(1),
  style: buttonStyleSchema.default('default'),
  url: z.string().url().optional(),
  priority: z.number().int().optional()
});

export const contentFieldSchema = z.object({
  label: z.string(),
  value: z.string()
});

export const contentSchema = z.object({
  mode: renderModeSchema.default('auto'),
  title: z.string().optional(),
  text: z.string().optional(),
  fields: z.array(contentFieldSchema).default([]),
  divider: z.boolean().default(false),
  footer: z.string().optional()
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
