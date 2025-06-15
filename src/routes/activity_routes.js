import { ActivityController } from "../controllers/ActivityController.js";
import { Router } from "express";
import { upload } from "../middlewares/uploadMiddleware.js";

export const ActivityRouter = Router();

ActivityRouter.get('/activity', ActivityController.getActivities);
ActivityRouter.get('/activity/case/:codeCase', ActivityController.getAllByCodeCase);
ActivityRouter.get('/activity/:id', ActivityController.getById);
ActivityRouter.get('/activity/document/:id', ActivityController.getDocumentById); 
ActivityRouter.post('/activity', upload.single("file"), ActivityController.createActivity);
ActivityRouter.put('/activity/:id', upload.single("file"), ActivityController.update);
ActivityRouter.get('/activity/report/excel', ActivityController.generateExcelReport);
ActivityRouter.get('/activity/internal/:internalId', ActivityController.getAllById);

