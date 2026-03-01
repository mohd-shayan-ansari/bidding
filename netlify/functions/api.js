import serverless from 'serverless-http'

let cachedHandler

async function getHandler() {
    if (cachedHandler) return cachedHandler

    // Ensure writable uploads path in Netlify Lambda runtime.
    process.env.NETLIFY = process.env.NETLIFY || 'true'
    process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/uploads'

    const [{ connectDb }, { createApp }, { seedInitialData }] = await Promise.all([
        import ('../../backend/src/config/db.js'),
        import ('../../backend/src/app.js'),
        import ('../../backend/src/utils/seed.js'),
    ])

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