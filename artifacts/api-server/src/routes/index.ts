import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dietLogsRouter from "./diet-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dietLogsRouter);

export default router;
