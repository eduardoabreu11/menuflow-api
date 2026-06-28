import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";

import { app } from "../app.js";

describe.sequential("Users CRUD", () => {
  let token: string;
  let userId: string;

  const testEmail = `cliente.teste.${Date.now()}@menuflow.com`;

  beforeAll(async () => {
    const response = await request(app).post("/login").send({
      email: "admin@menuflow.com",
      password: "123456",
    });

    token = response.body.token;
  });

  it("deve fazer login como MASTER para usar nos testes", async () => {
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });

  it("não deve criar usuário sem token", async () => {
    const response = await request(app).post("/users").send({
      name: "Cliente Sem Token",
      email: `sem.token.${Date.now()}@menuflow.com`,
      password: "123456",
      role: "RESTAURANT_OWNER",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Token não informado",
    });
  });

  it("não deve criar usuário com e-mail inválido", async () => {
    const response = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Teste",
        email: "emailerrado",
        password: "123456",
        role: "RESTAURANT_OWNER",
      });

    expect(response.status).toBe(400);
  });

  it("não deve criar usuário com role inválida", async () => {
    const response = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Teste",
        email: `role.invalida.${Date.now()}@menuflow.com`,
        password: "123456",
        role: "CLIENTE",
      });

    expect(response.status).toBe(400);
  });

  it("deve criar um usuário", async () => {
    const response = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Teste",
        email: testEmail,
        password: "123456",
        role: "RESTAURANT_OWNER",
      });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Cliente Teste");
    expect(response.body.email).toBe(testEmail);
    expect(response.body.role).toBe("RESTAURANT_OWNER");
    expect(response.body.is_active).toBe(true);
    expect(response.body).not.toHaveProperty("password");

    userId = response.body.id;
  });

  it("não deve criar usuário com e-mail duplicado", async () => {
    const response = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Duplicado",
        email: testEmail,
        password: "123456",
        role: "RESTAURANT_OWNER",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("deve listar usuários", async () => {
    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("deve buscar usuário por ID", async () => {
    const response = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(userId);
    expect(response.body.email).toBe(testEmail);
    expect(response.body).not.toHaveProperty("password");
  });

  it("deve atualizar usuário", async () => {
    const response = await request(app)
      .patch(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Teste Atualizado",
        role: "RESTAURANT_OWNER",
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(userId);
    expect(response.body.name).toBe("Cliente Teste Atualizado");
  });

  it("deve desativar usuário", async () => {
    const response = await request(app)
      .patch(`/users/${userId}/disable`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(userId);
    expect(response.body.is_active).toBe(false);
  });

  it("deve ativar usuário", async () => {
    const response = await request(app)
      .patch(`/users/${userId}/activate`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(userId);
    expect(response.body.is_active).toBe(true);
  });

  it("deve deletar usuário", async () => {
    const response = await request(app)
      .delete(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Usuário removido com sucesso");
    expect(response.body.user.id).toBe(userId);
  });

  it("deve retornar 404 ao buscar usuário deletado", async () => {
    const response = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Usuário não encontrado",
    });
  });
});