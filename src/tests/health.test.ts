import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app.js";

describe("GET /", () => {
  it("deve retornar status online da API", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      name: "MenuFlow API",
      status: "online",
    });
  });
});

describe("Rota inexistente", () => {
  it("deve retornar 404 quando a rota não existir", async () => {
    const response = await request(app).get("/rota-inexistente");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Rota não encontrada",
    });
  });
});

describe("JSON inválido", () => {
  it("deve retornar 400 quando o JSON enviado estiver quebrado", async () => {
    const response = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "JSON inválido",
    });
  });
});

describe("Rotas protegidas", () => {
  it("deve retornar 401 quando acessar rota protegida sem token", async () => {
    const response = await request(app).get("/users");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Token não informado",
    });
  });

  it("deve retornar 401 quando o token estiver mal formatado", async () => {
    const response = await request(app)
      .get("/users")
      .set("Authorization", "Token abc123");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Token mal formatado",
    });
  });
});

describe("Validação do login", () => {
  it("deve retornar 400 quando o body estiver vazio", async () => {
    const response = await request(app).post("/login").send({});

    expect(response.status).toBe(400);
  });

  it("deve retornar 400 quando o e-mail for inválido", async () => {
    const response = await request(app).post("/login").send({
      email: "emailerrado",
      password: "123456",
    });

    expect(response.status).toBe(400);
  });
});

describe("Public menu", () => {
  it("deve retornar 400 quando o slug for inválido", async () => {
    const response = await request(app).get("/public/menu/Slug%20Errado");

    expect(response.status).toBe(400);
  });
});