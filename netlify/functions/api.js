import 'dotenv/config'
import serverless from 'serverless-http'
import { connectDb } from '../../backend/src/config/db.js'
import { createApp } from '../../backend/src/app.js'
import { seedInitialData } from '../../backend/src/utils/seed.js'

let cachedHandler

async function getHandler() {
    if (cachedHandler) return cachedHandler

    await connectDb()
    await seedInitialData()

    const app = createApp()
    cachedHandler = serverless(app, {
        basePath: '/.netlify/functions/api',
    })

    return cachedHandler
}

export const handler = async(event, context) => {
    const appHandler = await getHandler()
    return appHandler(event, context)
}