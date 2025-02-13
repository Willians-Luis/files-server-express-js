import { Router } from 'express';
import folderRoute from './folder-route.js';
import fileRoute from './file-route.js';
import infoRoute from './info-route.js';


const router = Router()

router.use("/folder",folderRoute)
router.use("/file",fileRoute)
router.use("/info",infoRoute)

export default router
