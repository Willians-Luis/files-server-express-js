import { Router } from 'express';
import folderRoute from './folder-route.js';
import FileRoute from './file-route.js';


const router = Router()

router.use("/folder",folderRoute)
router.use("/file",FileRoute)

export default router
