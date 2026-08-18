import { Router } from "express";
import { CareersController } from "../controllers/recruitment.controller";
import { optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { candidateRegisterSchema, applyJobSchema } from "../schemas/phase2.schema";

const router = Router();
const controller = new CareersController();

router.get("/jobs", controller.listJobs);
router.get("/jobs/:slug", controller.getJob);
router.post("/register", validate(candidateRegisterSchema), controller.register);
router.post("/apply", optionalAuth, validate(applyJobSchema), controller.apply);

export { router as careersRouter };
