import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dietLogsRouter from "./diet-logs";
import profileRouter from "./profile";
import caloriesRouter from "./calories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dietLogsRouter);
router.use(profileRouter);
router.use(caloriesRouter);

export default router;
