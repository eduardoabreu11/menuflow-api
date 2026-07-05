import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app } from "../app.js";

describe.sequential("Autorização e isolamento por restaurante", () => {
  let masterToken: string;

  let ownerAToken: string;
  let ownerAId: string;
  let ownerBId: string;

  let restaurantAId: string;
  let restaurantBId: string;

  let categoryAId: string;
  let categoryBId: string;
  let ownerCreatedCategoryId: string;

  let productAId: string;
  let bannerAId: string;

  const timestamp = Date.now();

  const ownerAEmail = `owner.a.${timestamp}@menuflow.com`;
  const ownerBEmail = `owner.b.${timestamp}@menuflow.com`;

  beforeAll(async () => {
    const masterLoginResponse = await request(app).post("/login").send({
      email: "admin@menuflow.com",
      password: "123456",
    });

    masterToken = masterLoginResponse.body.token;

    const ownerAResponse = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        name: "Owner A Teste",
        email: ownerAEmail,
        password: "123456",
        role: "RESTAURANT_OWNER",
      });

    ownerAId = ownerAResponse.body.id;

    const ownerBResponse = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        name: "Owner B Teste",
        email: ownerBEmail,
        password: "123456",
        role: "RESTAURANT_OWNER",
      });

    ownerBId = ownerBResponse.body.id;

    const restaurantAResponse = await request(app)
      .post("/restaurants")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        owner_user_id: ownerAId,
        name: "Restaurante A Teste",
        slug: `restaurante-a-${timestamp}`,
        description: "Restaurante do owner A",
        logo_url: null,
        whatsapp: "98999999999",
        phone: "98999999999",
        address: "Endereço A",
        opening_hours: "08h às 18h",
      });

    restaurantAId = restaurantAResponse.body.id;

    const restaurantBResponse = await request(app)
      .post("/restaurants")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        owner_user_id: ownerBId,
        name: "Restaurante B Teste",
        slug: `restaurante-b-${timestamp}`,
        description: "Restaurante do owner B",
        logo_url: null,
        whatsapp: "98988888888",
        phone: "98988888888",
        address: "Endereço B",
        opening_hours: "08h às 18h",
      });

    restaurantBId = restaurantBResponse.body.id;

    const categoryAResponse = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        restaurant_id: restaurantAId,
        name: `Categoria A Base ${timestamp}`,
        emoji: "🍕",
      });

    categoryAId = categoryAResponse.body.id;

    const categoryBResponse = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        restaurant_id: restaurantBId,
        name: `Categoria B Base ${timestamp}`,
        emoji: "🍔",
      });

    categoryBId = categoryBResponse.body.id;

    const ownerALoginResponse = await request(app).post("/login").send({
      email: ownerAEmail,
      password: "123456",
    });

    ownerAToken = ownerALoginResponse.body.token;
  });

  afterAll(async () => {
    if (productAId) {
      await request(app)
        .delete(`/products/${productAId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }

    if (bannerAId) {
      await request(app)
        .delete(`/banners/${bannerAId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }

    if (ownerCreatedCategoryId) {
      await request(app)
        .delete(`/categories/${ownerCreatedCategoryId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }

    if (categoryAId) {
      await request(app)
        .delete(`/categories/${categoryAId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }

    if (categoryBId) {
      await request(app)
        .delete(`/categories/${categoryBId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }

    if (restaurantAId) {
      await request(app)
        .delete(`/restaurants/${restaurantAId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }

    if (restaurantBId) {
      await request(app)
        .delete(`/restaurants/${restaurantBId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }

    if (ownerAId) {
      await request(app)
        .delete(`/users/${ownerAId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }

    if (ownerBId) {
      await request(app)
        .delete(`/users/${ownerBId}`)
        .set("Authorization", `Bearer ${masterToken}`);
    }
  });

  it("deve permitir MASTER acessar restaurante de qualquer dono", async () => {
    const response = await request(app)
      .get(`/restaurants/${restaurantBId}`)
      .set("Authorization", `Bearer ${masterToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(restaurantBId);
  });

  it("deve permitir OWNER acessar o próprio restaurante", async () => {
    const response = await request(app)
      .get(`/restaurants/${restaurantAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(restaurantAId);
    expect(response.body.owner_user_id).toBe(ownerAId);
  });

  it("não deve permitir OWNER acessar restaurante de outro dono", async () => {
    const response = await request(app)
      .get(`/restaurants/${restaurantBId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect([403, 404]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
  });

  it("não deve permitir OWNER listar usuários", async () => {
    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  it("não deve permitir OWNER criar categoria em restaurante de outro dono", async () => {
    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantBId,
        name: `Categoria invasão ${timestamp}`,
        emoji: "🍔",
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  it("deve permitir OWNER criar categoria no próprio restaurante", async () => {
    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantAId,
        name: `Categoria própria ${timestamp}`,
        emoji: "🍕",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.restaurant_id).toBe(restaurantAId);

    ownerCreatedCategoryId = response.body.id;
  });

  it("não deve permitir OWNER criar produto em restaurante de outro dono", async () => {
    const response = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantBId,
        category_id: categoryBId,
        name: `Produto invasão ${timestamp}`,
        description: "Produto tentando invadir outro restaurante",
        price: 29.9,
        image_url: null,
        video_url: null,
        is_promotion: false,
        is_new: false,
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  it("não deve permitir OWNER criar produto usando categoria de outro restaurante", async () => {
    const response = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantAId,
        category_id: categoryBId,
        name: `Produto categoria errada ${timestamp}`,
        description: "Produto usando categoria de outro restaurante",
        price: 39.9,
        image_url: null,
        video_url: null,
        is_promotion: false,
        is_new: false,
      });

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
  });

  it("deve permitir OWNER criar produto no próprio restaurante", async () => {
    const response = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantAId,
        category_id: categoryAId,
        name: `Produto próprio ${timestamp}`,
        description: "Produto criado no restaurante correto",
        price: 49.9,
        image_url: null,
        video_url: null,
        is_promotion: false,
        is_new: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.restaurant_id).toBe(restaurantAId);
    expect(response.body.category_id).toBe(categoryAId);

    productAId = response.body.id;
  });

  it("não deve permitir OWNER criar banner em restaurante de outro dono", async () => {
    const response = await request(app)
      .post("/banners")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantBId,
        image_url: `https://example.com/banner-invasao-${timestamp}.jpg`,
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  it("deve permitir OWNER criar banner no próprio restaurante", async () => {
    const response = await request(app)
      .post("/banners")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantAId,
        image_url: `https://example.com/banner-proprio-${timestamp}.jpg`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.restaurant_id).toBe(restaurantAId);

    bannerAId = response.body.id;
  });

  it("não deve permitir OWNER acessar dashboard de restaurante de outro dono", async () => {
    const response = await request(app)
      .get(`/dashboard?restaurant_id=${restaurantBId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  it("deve permitir OWNER acessar dashboard do próprio restaurante", async () => {
    const response = await request(app)
      .get(`/dashboard?restaurant_id=${restaurantAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect(response.status).toBe(200);
    expect(typeof response.body).toBe("object");
  });

  it("não deve permitir OWNER acessar produtos recentes de restaurante de outro dono", async () => {
    const response = await request(app)
      .get(`/dashboard/recent-products?restaurant_id=${restaurantBId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  it("deve permitir OWNER acessar produtos recentes do próprio restaurante", async () => {
    const response = await request(app)
      .get(`/dashboard/recent-products?restaurant_id=${restaurantAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("deve permitir MASTER bloquear restaurante", async () => {
    const response = await request(app)
      .patch(`/restaurants/${restaurantAId}/block`)
      .set("Authorization", `Bearer ${masterToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(restaurantAId);
    expect(response.body.status).toBe("BLOCKED");
  });

  it("deve permitir OWNER visualizar o próprio restaurante bloqueado", async () => {
    const response = await request(app)
      .get(`/restaurants/${restaurantAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(restaurantAId);
    expect(response.body.status).toBe("BLOCKED");
  });

  it("não deve permitir OWNER criar categoria em restaurante bloqueado", async () => {
    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantAId,
        name: `Categoria bloqueada ${timestamp}`,
        emoji: "🚫",
      });

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("não deve permitir OWNER criar produto em restaurante bloqueado", async () => {
    const response = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantAId,
        category_id: categoryAId,
        name: `Produto bloqueado ${timestamp}`,
        description: "Produto tentando ser criado em restaurante bloqueado",
        price: 59.9,
        image_url: null,
        video_url: null,
        is_promotion: false,
        is_new: false,
      });

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("não deve permitir OWNER criar banner em restaurante bloqueado", async () => {
    const response = await request(app)
      .post("/banners")
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        restaurant_id: restaurantAId,
        image_url: `https://example.com/banner-bloqueado-${timestamp}.jpg`,
      });

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("não deve permitir OWNER acessar dashboard de restaurante bloqueado", async () => {
    const response = await request(app)
      .get(`/dashboard?restaurant_id=${restaurantAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("não deve permitir OWNER acessar produtos recentes de restaurante bloqueado", async () => {
    const response = await request(app)
      .get(`/dashboard/recent-products?restaurant_id=${restaurantAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("não deve permitir OWNER editar restaurante bloqueado", async () => {
    const response = await request(app)
      .patch(`/restaurants/${restaurantAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        name: "Restaurante A Bloqueado Editado",
        slug: `restaurante-a-${timestamp}`,
      });

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("não deve permitir OWNER editar categoria de restaurante bloqueado", async () => {
    const response = await request(app)
      .patch(`/categories/${categoryAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        name: `Categoria A Bloqueada ${timestamp}`,
        emoji: "🚫",
      });

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("não deve permitir OWNER editar produto de restaurante bloqueado", async () => {
    const response = await request(app)
      .patch(`/products/${productAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        name: `Produto Bloqueado Editado ${timestamp}`,
      });

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("não deve permitir OWNER editar banner de restaurante bloqueado", async () => {
    const response = await request(app)
      .patch(`/banners/${bannerAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`)
      .send({
        image_url: `https://example.com/banner-bloqueado-editado-${timestamp}.jpg`,
      });

    expect([400, 403]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Restaurante bloqueado");
  });

  it("deve permitir MASTER ativar restaurante bloqueado", async () => {
    const response = await request(app)
      .patch(`/restaurants/${restaurantAId}/activate`)
      .set("Authorization", `Bearer ${masterToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(restaurantAId);
    expect(response.body.status).toBe("ACTIVE");
  });

  it("deve permitir OWNER voltar a acessar dashboard após restaurante ser ativado", async () => {
    const response = await request(app)
      .get(`/dashboard?restaurant_id=${restaurantAId}`)
      .set("Authorization", `Bearer ${ownerAToken}`);

    expect(response.status).toBe(200);
    expect(typeof response.body).toBe("object");
  });
});