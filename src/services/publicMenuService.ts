import { PublicMenuRepository } from "../repositories/publicMenuRepository.js";

const publicMenuRepository = new PublicMenuRepository();

type PublicMenuRow = {
  category_id: string;
  category_name: string;
  category_emoji: string | null;
  category_sort_order: number;

  product_id: string | null;
  product_name: string | null;
  product_description: string | null;
  product_price: string | number | null;
  product_image_url: string | null;
  product_video_url: string | null;
  product_is_promotion: boolean | null;
  product_is_new: boolean | null;
};

type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string | number | null;
  image_url: string | null;
  video_url: string | null;
  is_promotion: boolean | null;
  is_new: boolean | null;
};

type PublicCategory = {
  id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  products: PublicProduct[];
};

export class PublicMenuService {
  async findBySlug(slug: string) {
    if (!slug) {
      throw new Error("Slug do restaurante é obrigatório");
    }

    const restaurant = await publicMenuRepository.findRestaurantBySlug(slug);

    if (!restaurant) {
      throw new Error("Restaurante não encontrado ou inativo");
    }

    const banners =
      await publicMenuRepository.findActiveBannersByRestaurantId(
        restaurant.id,
      );

    const rows =
      await publicMenuRepository.findActiveCategoriesWithProducts(
        restaurant.id,
      );

    const categoriesMap = new Map<string, PublicCategory>();

    for (const row of rows as PublicMenuRow[]) {
      if (!categoriesMap.has(row.category_id)) {
        categoriesMap.set(row.category_id, {
          id: row.category_id,
          name: row.category_name,
          emoji: row.category_emoji,
          sort_order: row.category_sort_order,
          products: [],
        });
      }

      if (row.product_id) {
        categoriesMap.get(row.category_id)?.products.push({
          id: row.product_id,
          name: row.product_name ?? "",
          description: row.product_description,
          price: row.product_price,
          image_url: row.product_image_url,
          video_url: row.product_video_url,
          is_promotion: row.product_is_promotion,
          is_new: row.product_is_new,
        });
      }
    }

    const categories = Array.from(categoriesMap.values());

    return {
      restaurant,
      banners,
      categories,
    };
  }
}