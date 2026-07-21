import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')

const loginTrend = new Trend('login_duration')
const profileTrend = new Trend('profile_duration')
const searchTrend = new Trend('search_duration')
const messagesTrend = new Trend('messages_duration')
const likeTrend = new Trend('like_duration')
const chatTrend = new Trend('chat_duration')

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.10'],
    http_req_duration: ['p(95)<2000'],
    login_duration: ['p(95)<3000'],
    profile_duration: ['p(95)<1000'],
    search_duration: ['p(95)<1500'],
  },
}

const BASE_URL = __ENV.API_URL || 'http://localhost:3002'
const USER_EMAIL = __ENV.USER_EMAIL || 'user5@demo.com'
const USER_PASSWORD = __ENV.USER_PASSWORD || 'password123'

export default function () {
  const loginPayload = JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  })
  loginTrend.add(loginRes.timings.duration)
  check(loginRes, { 'login status 200': (r) => r.status === 200 })
  errorRate.add(loginRes.status !== 200)

  if (loginRes.status !== 200) {
    sleep(1)
    return
  }

  const token = loginRes.json('token')
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  // GET /api/profile/2
  const profileRes = http.get(`${BASE_URL}/api/profile/2`, authHeaders)
  profileTrend.add(profileRes.timings.duration)
  check(profileRes, { 'profile status 200': (r) => r.status === 200 })
  errorRate.add(profileRes.status !== 200)

  // GET /api/search?limit=10
  const searchRes = http.get(`${BASE_URL}/api/search?limit=10`, authHeaders)
  searchTrend.add(searchRes.timings.duration)
  check(searchRes, { 'search status 200': (r) => r.status === 200 })
  errorRate.add(searchRes.status !== 200)

  // GET /api/chats
  const chatsRes = http.get(`${BASE_URL}/api/chats`, authHeaders)
  chatTrend.add(chatsRes.timings.duration)
  check(chatsRes, { 'chats status 200': (r) => r.status === 200 })

  // POST /api/likes (like user 3)
  const likePayload = JSON.stringify({ liked_id: 3 })
  const likeRes = http.post(`${BASE_URL}/api/likes`, likePayload, authHeaders)
  likeTrend.add(likeRes.timings.duration)
  check(likeRes, { 'like status 200/201': (r) => r.status === 200 || r.status === 201 })

  // GET /api/chats/1/messages
  const msgsRes = http.get(`${BASE_URL}/api/chats/1/messages`, authHeaders)
  messagesTrend.add(msgsRes.timings.duration)
  check(msgsRes, { 'messages status 200': (r) => r.status === 200 })

  // GET /api/activity
  http.get(`${BASE_URL}/api/activity`, authHeaders)

  // GET /api/matches
  http.get(`${BASE_URL}/api/matches`, authHeaders)

  sleep(1)
}
