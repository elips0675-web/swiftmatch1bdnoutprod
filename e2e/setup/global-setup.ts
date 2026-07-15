import { request } from '@playwright/test'

async function globalSetup() {
  const api = await request.newContext()
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3002'

  console.log('🌐 Global setup: checking API health...')

  const health = await api.get(`${baseUrl}/health`).catch(() => null)
  if (!health || health.status() !== 200) {
    throw new Error(`API at ${baseUrl} is not responding. Start the server first!`)
  }

  const healthBody = await health.json()
  if (healthBody.db !== 'connected') {
    throw new Error('MySQL database is not connected!')
  }

  console.log('✅ API is healthy, DB connected')
  console.log('🌍 Base URL:', process.env.TEST_BASE_URL || 'http://localhost:8081')

  await api.dispose()
}

export default globalSetup
