import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger";

const router = Router();

/** Raw OpenAPI JSON — useful for Postman / code generators */
router.get("/openapi.json", (_req, res) => {
  res.json(swaggerSpec);
});

router.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Workforce 360 API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
      docExpansion: "list",
      filter: true,
      tryItOutEnabled: true,
    },
  }),
);

export { router as swaggerRouter };
