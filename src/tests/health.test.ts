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