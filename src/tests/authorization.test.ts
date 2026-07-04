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

    const ownerALoginResponse = await request(app).post("/login").send({
      email: ownerAEmail,
      password: "123456",
    });

    ownerAToken = ownerALoginResponse.body.token;
  });

  afterAll(async () => {
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
  });
});