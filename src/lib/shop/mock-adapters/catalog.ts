import { getProductDetail } from "@/lib/mock-data/product-details";
import { fetchProductSegmentPrice, getProductBySku, getProducts } from "@/lib/mock-data/products";
import type { CatalogAdapter } from "@/lib/shop-platform/adapters";

export const mockCatalogAdapter: CatalogAdapter = {
  async searchProducts({ query, category, limit = 6, userSegment } = {}) {
    const search = query?.trim().toLowerCase();
    const items = getProducts(category).filter((product) => {
      if (!search) return true;

      return [
        product.sku,
        product.name,
        product.category,
        product.content.shortDescription,
        product.content.longDescription,
      ].some((value) => value.toLowerCase().includes(search));
    }).slice(0, limit);

    const products = await Promise.all(
      items.map(async (product) => ({
        sku: product.sku,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        shortDescription: product.content.shortDescription,
        price: await fetchProductSegmentPrice(product.sku, userSegment),
      })),
    );
    return {
      products,
      message: products.length
        ? `Found ${products.length} matching product(s).`
        : "No matching products found.",
    };
  },

  async getProductDetails({ sku }) {
    const product = getProductBySku(sku);
    if (!product) {
      return { error: `No product found for SKU ${sku}` };
    }
    return {
      product: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        shortDescription: product.content.shortDescription,
        longDescription: product.content.longDescription,
        price: await fetchProductSegmentPrice(product.sku),
      },
    };
  },

  async getProductFaq({ sku }) {
    const detail = getProductDetail(sku);
    if (!detail) {
      return { error: `No FAQ found for SKU ${sku}` };
    }
    return { sku, faqs: detail.faqs, specifications: detail.specifications };
  },

  async getProductManual({ sku }) {
    const detail = getProductDetail(sku);
    if (!detail) {
      return { error: `No manual found for SKU ${sku}` };
    }
    return { sku, manual: detail.manual };
  },
};
