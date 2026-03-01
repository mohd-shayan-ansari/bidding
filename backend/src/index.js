import 'dotenv/config'
import { connectDb } from './config/db.js'
import { createApp } from './app.js'
import { seedInitialData } from './utils/seed.js'

async function bootstrap() {
    await connectDb()
    await seedInitialData()

    const app = createApp()
    const PORT = Number(process.env.PORT || 4000)

    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`)
    })
}

bootstrap().catch((error) => {
    console.error('Failed to start backend:', error)
    process.exit(1)
})