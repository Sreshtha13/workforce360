import { apiReference } from "@scalar/express-api-reference";
import { Router } from "express";
import { swaggerSpec } from "../config/swagger";

const router = Router();

/** Raw OpenAPI JSON — useful for Postman / code generators */
router.get("/openapi.json", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=0");
  res.json(swaggerSpec);
});

/** Scalar API reference UI */
router.use(
  "/",
  apiReference({
    content: swaggerSpec,
    theme: "purple",
    layout: "modern",
    pageTitle: "Workforce 360 API Docs",
    metaData: {
      title: "Workforce 360 ERP API",
      description: "Interactive API reference for Workforce 360 ERP",
    },
    persistAuth: true,
    authentication: {
      preferredSecurityScheme: ["cookieAuth", "bearerAuth"],
    },
    defaultHttpClient: {
      targetKey: "node",
      clientKey: "fetch",
    },
    searchHotKey: "k",
    customFetch: (input, init) =>
      fetch(input, { ...init, credentials: "include" }),
    _integration: "express",
  }),
);

export { router as swaggerRouter };
