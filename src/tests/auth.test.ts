import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app.js";

function normalizeSetCookieHeader(
  setCookie: string | string[] | undefined,
) {
  if (!setCookie) {
    return [];
  }

  return Array.isArray(setCookie) ? setCookie : [setCookie];
}

describe.sequential("Auth com cookie httpOnly", () => {
  const agent = request.agent(app);

  it("deve fazer login e gravar cookie httpOnly", async () => {
    const response = await agent.post("/login").send({
      email: "admin@menuflow.com",
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("token");

    const cookies = normalizeSetCookieHeader(response.headers["set-cookie"]);

    expect(cookies.length).toBeGreaterThan(0);

    const authCookie = cookies.find((cookie) =>
      cookie.startsWith("menuflow_token="),
    );

    expect(authCookie).toBeDefined();
    expect(authCookie).toContain("HttpOnly");
    expect(authCookie).toContain("SameSite=Lax");
  });

  it("deve acessar /me usando apenas cookie", async () => {
    const response = await agent.get("/me");

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("admin@menuflow.com");
    expect(response.body.role).toBe("MASTER");
    expect(response.body).not.toHaveProperty("password");
  });

  it("deve fazer logout e limpar cookie", async () => {
    const response = await agent.post("/logout");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Logout realizado com sucesso",
    });

    const cookies = normalizeSetCookieHeader(response.headers["set-cookie"]);

    const clearedCookie = cookies.find((cookie) =>
      cookie.startsWith("menuflow_token="),
    );

    expect(clearedCookie).toBeDefined();
  });

  it("não deve acessar /me depois do logout", async () => {
    const response = await agent.get("/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Token não informado",
    });
  });

  it("não deve permitir login de usuário inativo", async () => {
    const masterAgent = request.agent(app);

    await masterAgent.post("/login").send({
      email: "admin@menuflow.com",
      password: "123456",
    });

    const email = `inactive-login-${Date.now()}@menuflow.com`;

    const createResponse = await masterAgent.post("/users").send({
      name: "Usuário Inativo Login",
      email,
      password: "123456",
      role: "RESTAURANT_OWNER",
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty("id");

    const userId = createResponse.body.id;

    const disableResponse = await masterAgent.patch(`/users/${userId}/disable`);

    expect(disableResponse.status).toBe(200);
    expect(disableResponse.body.is_active).toBe(false);

    const loginResponse = await request(app).post("/login").send({
      email,
      password: "123456",
    });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body).toEqual({
      message: "Usuário inativo",
    });

    await masterAgent.delete(`/users/${userId}`);
  });

  it("não deve permitir que usuário desativado continue usando token antigo", async () => {
    const masterAgent = request.agent(app);

    await masterAgent.post("/login").send({
      email: "admin@menuflow.com",
      password: "123456",
    });

    const email = `inactive-token-${Date.now()}@menuflow.com`;

    const createResponse = await masterAgent.post("/users").send({
      name: "Usuário Inativo Token",
      email,
      password: "123456",
      role: "RESTAURANT_OWNER",
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty("id");

    const userId = createResponse.body.id;

    const userAgent = request.agent(app);

    const loginResponse = await userAgent.post("/login").send({
      email,
      password: "123456",
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe(email);

    const meBeforeDisableResponse = await userAgent.get("/me");

    expect(meBeforeDisableResponse.status).toBe(200);
    expect(meBeforeDisableResponse.body.email).toBe(email);
    expect(meBeforeDisableResponse.body.is_active).toBe(true);

    const disableResponse = await masterAgent.patch(`/users/${userId}/disable`);

    expect(disableResponse.status).toBe(200);
    expect(disableResponse.body.is_active).toBe(false);

    const meAfterDisableResponse = await userAgent.get("/me");

    expect(meAfterDisableResponse.status).toBe(403);
    expect(meAfterDisableResponse.body).toEqual({
      message: "Usuário inativo",
    });

    const cookies = normalizeSetCookieHeader(
      meAfterDisableResponse.headers["set-cookie"],
    );

    const clearedCookie = cookies.find((cookie) =>
      cookie.startsWith("menuflow_token="),
    );

    expect(clearedCookie).toBeDefined();

    await masterAgent.delete(`/users/${userId}`);
  });
});