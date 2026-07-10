import { Router } from "express";

import { authMiddleware } from "../config/jwt.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { handleAsaasWebhook } from "../controllers/asaasWebhookController.js";

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
  createUserBodySchema,
  updateUserBodySchema,
} from "../validations/userValidation.js";

import {
  createPlanBodySchema,
  updatePlanBodySchema,
} from "../validations/planValidation.js";

import {
  createRestaurantBodySchema,
  updateRestaurantBodySchema,
} from "../validations/restaurantValidation.js";

import {
  createSubscriptionBodySchema,
  subscriptionIdParamsSchema,
  subscriptionRestaurantIdParamsSchema,
  updateSubscriptionBodySchema,
} from "../validations/subscriptionValidation.js";

import {
  createPaymentBodySchema,
  markPaymentAsPaidBodySchema,
  paymentIdParamsSchema,
  paymentRestaurantIdParamsSchema,
  paymentSubscriptionIdParamsSchema,
  updatePaymentBodySchema,
  generateMonthlyPaymentsBodySchema,
  createAsaasChargeBodySchema,
  
} from "../validations/paymentValidation.js";

import {
  activate as userActivate,
  destroy as userDestroy,
  disable as userDisable,
  index as userIndex,
  login,
  logout,
  me,
  show as userShow,
  store as userStore,
  update as userUpdate,
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

import {
  cancelSubscriptionController,
  createSubscriptionController,
  getSubscriptionByIdController,
  getSubscriptionByRestaurantIdController,
  listSubscriptionsController,
  updateSubscriptionController,
} from "../controllers/subscriptionController.js";

import {
  cancelPaymentController,
  createPaymentController,
  deletePaymentController,
  getPaymentByIdController,
  getPaymentsByRestaurantIdController,
  getPaymentsBySubscriptionIdController,
  listPaymentsController,
  markPaymentAsPaidController,
  updatePaymentController,
  generateMonthlyPaymentsController,
  createAsaasChargeForPaymentController,
} from "../controllers/paymentController.js";

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
import { listPaymentRemindersController } from "../controllers/paymentReminderController.js";

/* =========================
   AUTH
========================= */

router.post(
  "/login",
  validateRequest({
    body: loginBodySchema,
  }),
  asyncHandler(login),
);

/* =========================
   PUBLIC MENU
========================= */

router.get(
  "/public/menu/:slug",
  validateRequest({
    params: slugParamSchema,
  }),
  asyncHandler((req, res) => publicMenuController.show(req, res)),
);

/* =========================
   ASAAS WEBHOOK
========================= */

router.post("/webhooks/asaas", asyncHandler(handleAsaasWebhook));

/* =========================
   USERS - MASTER
========================= */

router.get(
  "/users",
  authMiddleware,
  requireRole("MASTER"),
  asyncHandler(userIndex),
);

router.get(
  "/users/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(userShow),
);

router.post(
  "/users",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    body: createUserBodySchema,
  }),
  asyncHandler(userStore),
);

router.patch(
  "/users/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateUserBodySchema,
  }),
  asyncHandler(userUpdate),
);

router.patch(
  "/users/:id/activate",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(userActivate),
);

router.patch(
  "/users/:id/disable",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(userDisable),
);

router.delete(
  "/users/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(userDestroy),
);

router.post("/logout", authMiddleware, asyncHandler(logout));

router.get("/me", authMiddleware, asyncHandler(me));

/* =========================
   RESTAURANTS - MASTER + OWNER
========================= */

router.get(
  "/restaurants",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  asyncHandler(restaurantIndex),
);

router.get(
  "/restaurants/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(restaurantShow),
);

router.post(
  "/restaurants",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    body: createRestaurantBodySchema,
  }),
  asyncHandler(restaurantStore),
);

router.patch(
  "/restaurants/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateRestaurantBodySchema,
  }),
  asyncHandler(restaurantUpdate),
);

router.patch(
  "/restaurants/:id/block",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(restaurantBlock),
);

router.patch(
  "/restaurants/:id/activate",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(restaurantActivate),
);

router.delete(
  "/restaurants/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(restaurantDestroy),
);

/* =========================
   PLANS - MASTER
========================= */

router.get(
  "/plans",
  authMiddleware,
  requireRole("MASTER"),
  asyncHandler(planIndex),
);

router.get(
  "/plans/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(planShow),
);

router.post(
  "/plans",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    body: createPlanBodySchema,
  }),
  asyncHandler(planStore),
);

router.patch(
  "/plans/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
    body: updatePlanBodySchema,
  }),
  asyncHandler(planUpdate),
);

router.patch(
  "/plans/:id/disable",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(planDisable),
);

router.delete(
  "/plans/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler(planDestroy),
);

/* =========================
   SUBSCRIPTIONS - MASTER
========================= */

router.get(
  "/subscriptions",
  authMiddleware,
  requireRole("MASTER"),
  listSubscriptionsController,
);

router.get(
  "/subscriptions/restaurant/:restaurant_id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: subscriptionRestaurantIdParamsSchema,
  }),
  getSubscriptionByRestaurantIdController,
);

router.get(
  "/subscriptions/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: subscriptionIdParamsSchema,
  }),
  getSubscriptionByIdController,
);

router.post(
  "/subscriptions",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    body: createSubscriptionBodySchema,
  }),
  createSubscriptionController,
);

router.patch(
  "/subscriptions/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: subscriptionIdParamsSchema,
    body: updateSubscriptionBodySchema,
  }),
  updateSubscriptionController,
);

router.patch(
  "/subscriptions/:id/cancel",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: subscriptionIdParamsSchema,
  }),
  cancelSubscriptionController,
);

/* =========================
   PAYMENTS - MASTER
========================= */

router.get(
  "/payments",
  authMiddleware,
  requireRole("MASTER"),
  listPaymentsController,
);

router.get(
  "/payments/restaurant/:restaurant_id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: paymentRestaurantIdParamsSchema,
  }),
  getPaymentsByRestaurantIdController,
);

router.get(
  "/payments/subscription/:subscription_id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: paymentSubscriptionIdParamsSchema,
  }),
  getPaymentsBySubscriptionIdController,
);

router.get(
  "/payments/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: paymentIdParamsSchema,
  }),
  getPaymentByIdController,
);

router.post(
  "/payments",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    body: createPaymentBodySchema,
  }),
  createPaymentController,
);

router.patch(
  "/payments/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: paymentIdParamsSchema,
    body: updatePaymentBodySchema,
  }),
  updatePaymentController,
);

router.post(
  "/payments/generate-monthly",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    body: generateMonthlyPaymentsBodySchema,
  }),
  generateMonthlyPaymentsController,
);

router.patch(
  "/payments/:id/pay",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: paymentIdParamsSchema,
    body: markPaymentAsPaidBodySchema,
  }),
  markPaymentAsPaidController,
);

router.patch(
  "/payments/:id/cancel",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: paymentIdParamsSchema,
  }),
  cancelPaymentController,
);

router.delete(
  "/payments/:id",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: paymentIdParamsSchema,
  }),
  deletePaymentController,
);

router.post(
  "/payments/:id/asaas-charge",
  authMiddleware,
  requireRole("MASTER"),
  validateRequest({
    params: paymentIdParamsSchema,
    body: createAsaasChargeBodySchema,
  }),
  createAsaasChargeForPaymentController,
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
  asyncHandler((req, res) => categoryController.create(req, res)),
);

router.get(
  "/categories",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    query: optionalRestaurantIdQuerySchema,
  }),
  asyncHandler((req, res) => categoryController.findAll(req, res)),
);

router.get(
  "/categories/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => categoryController.findById(req, res)),
);

router.patch(
  "/categories/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateCategoryBodySchema,
  }),
  asyncHandler((req, res) => categoryController.update(req, res)),
);

router.patch(
  "/categories/:id/activate",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => categoryController.activate(req, res)),
);

router.patch(
  "/categories/:id/disable",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => categoryController.disable(req, res)),
);

router.delete(
  "/categories/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => categoryController.delete(req, res)),
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
  asyncHandler((req, res) => productController.create(req, res)),
);

router.get(
  "/products",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    query: listProductsQuerySchema,
  }),
  asyncHandler((req, res) => productController.findAll(req, res)),
);

router.get(
  "/products/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => productController.findById(req, res)),
);

router.patch(
  "/products/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateProductBodySchema,
  }),
  asyncHandler((req, res) => productController.update(req, res)),
);

router.patch(
  "/products/:id/activate",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => productController.activate(req, res)),
);

router.patch(
  "/products/:id/disable",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => productController.disable(req, res)),
);

router.delete(
  "/products/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => productController.delete(req, res)),
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
  asyncHandler((req, res) => bannerController.create(req, res)),
);

router.get(
  "/banners",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    query: optionalRestaurantIdQuerySchema,
  }),
  asyncHandler((req, res) => bannerController.findAll(req, res)),
);

router.get(
  "/banners/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => bannerController.findById(req, res)),
);

router.patch(
  "/banners/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
    body: updateBannerBodySchema,
  }),
  asyncHandler((req, res) => bannerController.update(req, res)),
);

router.patch(
  "/banners/:id/activate",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => bannerController.activate(req, res)),
);

router.patch(
  "/banners/:id/disable",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => bannerController.disable(req, res)),
);

router.delete(
  "/banners/:id",
  authMiddleware,
  requireRole("MASTER", "RESTAURANT_OWNER"),
  validateRequest({
    params: uuidParamSchema,
  }),
  asyncHandler((req, res) => bannerController.delete(req, res)),
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
  asyncHandler((req, res) => dashboardController.getStats(req, res)),
);

router.get(
  "/dashboard/recent-products",
  authMiddleware,
  requireRole("RESTAURANT_OWNER"),
  validateRequest({
    query: restaurantIdQuerySchema,
  }),
  asyncHandler((req, res) => dashboardController.getRecentProducts(req, res)),
);







router.get(
  "/payment-reminders",
  authMiddleware,
  requireRole("MASTER"),
  listPaymentRemindersController,
);

export default router;