import { z } from "zod";

export const catalogContentSchema = z.object({
  shortDescription: z.string(),
  longDescription: z.string(),
});

export const seoContentSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
});

const productImageUrlSchema = z.string().refine((value) => {
  if (value.startsWith("/")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "Image URL must be root-relative or an absolute http(s) URL");

export const productSchema = z.object({
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  imageUrl: productImageUrlSchema,
  content: catalogContentSchema,
  seoContent: seoContentSchema,
});

export type CatalogContent = z.infer<typeof catalogContentSchema>;
export type SEOContent = z.infer<typeof seoContentSchema>;
export type Product = z.infer<typeof productSchema>;
