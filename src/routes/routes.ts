import { Router } from "express";

import { authMiddleware } from "../config/jwt.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";

import {
  createProductBodySchema,
  updateProductBodySchema,
  listProductsQuerySchema,
} from "../validations/productValidation.js";

import {
  createBannerBodySchema,
  updateBannerBodySchema,
} from "../validations/bannerValidation.js";

import {
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from "../validations/categoryValidation.js";

import { loginBodySchema } from "../validations/authValidation.js";

import {
  uuidParamSchema,
  slugParamSchema,
  restaurantIdQuerySchema,
  optionalRestaurantIdQuerySchema,
} from "../validations/commonValidation.js";

import {
  createPlanBodySchema,
  updatePlanBodySchema,
} from "../validations/planValidation.js";

import {
  createRestaurantBodySchema,
  updateRestaurantBodySchema,
} from "../validations/restaurantValidation.js";

import {
  index as userIndex,
  login,
  show as userShow,
} from "../controllers/userController.js";

import {
  index as restaurantIndex,
  show as restaurantShow,
  store as restaurantStore,
  update as restaurantUpdate,
  block as restaurantBlock,
  activate as restaurantActivate,
  destroy as restaurantDestroy,
} from "../controllers/restaurantController.js";

import {
  index as planIndex,
  show as planShow,
  store as planStore,
  update as planUpdate,
  disable as planDisable,
  destroy as planDestroy,
} from "../controllers/planController.js";

import { CategoryController } from "../controllers/categoryController.js";
import { ProductController } from "../controllers/productController.js";
import { BannerController } from "../controllers/bannerController.js";
import { DashboardController } from "../controllers/dashboardController.js";
import { PublicMenuController } from "../controllers/publicMenuController.js";

const router = Router();

const categoryController = new CategoryController();
const productController = new ProductController();
const bannerController = new BannerController();
const dashboardController = new DashboardController();
const publicMenuController = new PublicMenuController();

/* =========================
   AUTH
========================= */

router.post(
  "/login",
  validateRequest({
    body: loginBodySchema,
  }),
  login,
);

/* =========================
   PUBLIC MENU
========================= */

router.get(
  "/public/menu/:slug",
  validateRequest({
    params: slugParamSchema,
  }),
  publicMenuController.show,
);

/* =========================
   USERS - MASTER
========================= */

router.get("/users", authMiddleware, requireRole("MASTER"), userIndex);

router.get(
  "/users/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  userShow,
);

/* =========================
   RESTAURANTS - MASTER + OWNER
========================= */

router.get(
  "/restaurants",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  restaurantIndex,
);

router.get(
  "/restaurants/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  restaurantShow,
);

router.post(
  "/restaurants",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    body: createRestaurantBodySchema,
  }),
  restaurantStore,
);

router.patch(
  "/restaurants/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateRestaurantBodySchema,
  }),
  restaurantUpdate,
);

router.patch(
  "/restaurants/:id/block",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  restaurantBlock,
);

router.patch(
  "/restaurants/:id/activate",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  restaurantActivate,
);

router.delete(
  "/restaurants/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  restaurantDestroy,
);

/* =========================
   PLANS - MASTER
========================= */

router.get("/plans", authMiddleware, requireRole("MASTER"), planIndex);

router.get(
  "/plans/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  planShow,
);

router.post(
  "/plans",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    body: createPlanBodySchema,
  }),
  planStore,
);

router.patch(
  "/plans/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
    body: updatePlanBodySchema,
  }),
  planUpdate,
);

router.patch(
  "/plans/:id/disable",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  planDisable,
);

router.delete(
  "/plans/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  planDestroy,
);

/* =========================
   CATEGORIES - MASTER + OWNER
========================= */

router.post(
  "/categories",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    body: createCategoryBodySchema,
  }),
  categoryController.create,
);

router.get(
  "/categories",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    query: optionalRestaurantIdQuerySchema,
  }),
  categoryController.findAll,
);

router.get(
  "/categories/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  categoryController.findById,
);

router.patch(
  "/categories/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateCategoryBodySchema,
  }),
  categoryController.update,
);

router.patch(
  "/categories/:id/activate",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  categoryController.activate,
);

router.patch(
  "/categories/:id/disable",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  categoryController.disable,
);

router.delete(
  "/categories/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  categoryController.delete,
);

/* =========================
   PRODUCTS - MASTER + OWNER
========================= */

router.post(
  "/products",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    body: createProductBodySchema,
  }),
  productController.create,
);

router.get(
  "/products",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    query: listProductsQuerySchema,
  }),
  productController.findAll,
);
router.get(
  "/products/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  productController.findById,
);

router.patch(
  "/products/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateProductBodySchema,
  }),
  productController.update,
);

router.patch(
  "/products/:id/activate",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  productController.activate,
);

router.patch(
  "/products/:id/disable",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  productController.disable,
);

router.delete(
  "/products/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  productController.delete,
);

/* =========================
   BANNERS - MASTER + OWNER
========================= */

router.post(
  "/banners",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    body: createBannerBodySchema,
  }),
  bannerController.create,
);

router.get(
  "/banners",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    query: optionalRestaurantIdQuerySchema,
  }),
  bannerController.findAll,
);

router.get(
  "/banners/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  bannerController.findById,
);

router.patch(
  "/banners/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateBannerBodySchema,
  }),
  bannerController.update,
);

router.patch(
  "/banners/:id/activate",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  bannerController.activate,
);

router.patch(
  "/banners/:id/disable",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  bannerController.disable,
);

router.delete(
  "/banners/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  bannerController.delete,
);

/* =========================
   DASHBOARD - RESTAURANT OWNER
========================= */

router.get(
  "/dashboard",
  authMiddleware,
  requireRole("RESTAURANT_OWNER"),
  validateRequest({
    query: restaurantIdQuerySchema,
  }),
  dashboardController.getStats,
);

router.get(
  "/dashboard/recent-products",
  authMiddleware,
  requireRole("RESTAURANT_OWNER"),
  validateRequest({
    query: restaurantIdQuerySchema,
  }),
  dashboardController.getRecentProducts,
);

export default router;
