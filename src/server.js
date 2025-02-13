import express from 'express'
import cors from 'cors'
import router from './routes/index.js'


const app = express()

app.use(express.json())

app.use(cors())

app.use(router)

const HOST = process.env.HOST ? process.env.HOST : "0.0.0.0"
const PORT = process.env.PORT ? Number(process.env.PORT) : 3333

app.listen(PORT, HOST, () => console.log(`Server runing http://${HOST}:${PORT}`))
