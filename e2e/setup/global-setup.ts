import { request, chromium } from '@playwright/test'

async function saveStorageState(email: string, password: string, outputPath: string) {
  const api = await request.newContext()
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3002'

  const res = await api.post(`${baseUrl}/api/auth/login`, {
    data: { email, password },
  })
  if (res.status() !== 200) {
    console.warn(`⚠️ Could not login ${email}: ${res.status()}`)
    await api.dispose()
    return
  }
  const body = await res.json()
  const token = body.token
  if (!token) {
    console.warn(`⚠️ No token for ${email}`)
    await api.dispose()
    return
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(process.env.TEST_BASE_URL || 'http://localhost:8081')
  await page.evaluate((t) => {
    localStorage.setItem('token', t)
  }, token)
  await page.context().storageState({ path: outputPath })
  await browser.close()
  await api.dispose()
  console.log(`✅ Storage state saved: ${outputPath}`)
}

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

  const authDir = 'e2e/.auth'
  await saveStorageState('user2@mail.ru', 'demo123456', `${authDir}/demo.json`)
  await saveStorageState('admin@mail.ru', 'demo123456', `${authDir}/admin.json`)
  await saveStorageState('user4@mail.ru', 'demo123456', `${authDir}/user4.json`)
  await saveStorageState('user5@mail.ru', 'demo123456', `${authDir}/user5.json`)
}

export default globalSetup
