import express from 'express'
import cors from 'cors'
import router from './routes/index.js'
import { cleanupTempFiles } from './services/cleanup-temp-files.js'


const app = express()

app.use(express.json({ limit: '10gb' }))

app.use(express.urlencoded({ limit: '10gb', extended: true }))

app.use((req, res, next) => {
    req.setTimeout(30 * 60 * 1000)
    res.setTimeout(30 * 60 * 1000)
    next()
})

app.use(cors())

app.use(router)

const HOST = process.env.HOST || "0.0.0.0"
const PORT = process.env.PORT || 3333

await cleanupTempFiles()

app.listen(PORT, HOST, () => {
    console.log(`Server runing http://${HOST}:${PORT}`)
})
