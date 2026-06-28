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
});