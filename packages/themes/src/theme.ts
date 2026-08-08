import { localizedTextSchema } from '@botui/schema';
import { z } from 'zod';

const iconsSchema = z.object({
  success: z.string().min(1),
  error: z.string().min(1),
  warning: z.string().min(1),
  home: z.string().min(1),
  back: z.string().min(1),
  first: z.string().min(1),
  previous: z.string().min(1),
  next: z.string().min(1),
  last: z.string().min(1),
  refresh: z.string().min(1)
}).strict();

const labelsSchema = z.object({
  home: localizedTextSchema,
  back: localizedTextSchema,
  first: localizedTextSchema,
  previous: localizedTextSchema,
  next: localizedTextSchema,
  last: localizedTextSchema,
  refresh: localizedTextSchema
}).strict();

const layoutSchema = z.object({
  maxPerRow: z.union([z.literal(1), z.literal(2)]),
  longTextThreshold: z.number().int().min(4).max(64)
}).strict();

const regularSchema = z.object({
  divider: z.string().min(1).max(64)
}).strict();

const richSchema = z.object({
  defaultHeadingSize: z.number().int().min(1).max(6)
}).strict();

export const themeSchema = z.object({
  name: z.string().min(1),
  icons: iconsSchema,
  labels: labelsSchema,
  layout: layoutSchema,
  regular: regularSchema,
  rich: richSchema
}).strict();

export type BotUITheme = z.infer<typeof themeSchema>;
export type ThemeRegistry = Record<string, BotUITheme>;

export type ThemeOverrides = {
  icons?: Partial<BotUITheme['icons']> | undefined;
  labels?: Partial<BotUITheme['labels']> | undefined;
  layout?: Partial<BotUITheme['layout']> | undefined;
  regular?: Partial<BotUITheme['regular']> | undefined;
  rich?: Partial<BotUITheme['rich']> | undefined;
};

export function mergeTheme(base: BotUITheme, overrides: ThemeOverrides = {}): BotUITheme {
  return themeSchema.parse({
    name: base.name,
    icons: { ...base.icons, ...overrides.icons },
    labels: { ...base.labels, ...overrides.labels },
    layout: { ...base.layout, ...overrides.layout },
    regular: { ...base.regular, ...overrides.regular },
    rich: { ...base.rich, ...overrides.rich }
  });
}
