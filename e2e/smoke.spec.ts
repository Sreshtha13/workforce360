import { test, expect } from "@playwright/test";

const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:4000";

test.describe("API smoke", () => {
  test("health endpoint returns envelope", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body.error).toBeNull();
  });
});

test.describe("Web smoke", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Authenticated smoke", () => {
  test.skip(!process.env.PLAYWRIGHT_LOGIN_EMAIL, "Set PLAYWRIGHT_LOGIN_EMAIL/PASSWORD for auth smoke");

  test("login reaches dashboard", async ({ page }) => {
    const email = process.env.PLAYWRIGHT_LOGIN_EMAIL!;
    const password = process.env.PLAYWRIGHT_LOGIN_PASSWORD ?? "Admin@123";

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});
