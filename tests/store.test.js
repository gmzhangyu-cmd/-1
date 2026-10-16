const test = require('node:test')
const assert = require('node:assert/strict')

function createStore(seed) {
  const storage = new Map()
  global.wx = {
    getStorageSync(key) { return storage.get(key) },
    setStorageSync(key, value) { storage.set(key, JSON.parse(JSON.stringify(value))) }
  }
  delete require.cache[require.resolve('../utils/store')]
  const store = require('../utils/store')
  if (seed) wx.setStorageSync(store.STORAGE_KEY, seed)
  return store
}

test('初始化新版目标和本机账号', () => {
  const store = createStore()
  store.ensureInitialized()
  const state = store.getState()
  assert.deepEqual(state.settings.targets, { weight: '', waist: '', hip: '', bodyFat: '' })
  assert.equal(state.profile.registered, false)
})

test('兼容迁移旧版身体与用药记录', () => {
  const store = createStore({
    settings: { injectionIntervalDays: 8, targets: { protein: 90 } },
    injections: [{ id: 'old-shot', date: '2026-10-10', time: '09:00' }],
    dailyRecords: [{ id: 'old-day', date: '2026-10-10', weight: 65, foods: [{ name: '鸡蛋' }] }]
  })
  const state = store.getState()
  assert.equal(state.settings.shotIntervalDays, 8)
  assert.equal(state.shots[0].id, 'old-shot')
  assert.equal(state.dailyRecords[0].meals.lunch, '鸡蛋')
})

test('保存 💉 记录时同步有效期', () => {
  const store = createStore()
  store.ensureInitialized()
  const item = store.upsertShot({ date: '2026-10-16', time: '09:00', site: '腹部左侧', expiryDate: '2027-02-01' })
  assert.match(item.id, /^shot-/)
  assert.equal(store.getState().settings.medicationExpiryDate, '2027-02-01')
})

test('同一天身体记录会更新并保留趣味水瓶结构', () => {
  const store = createStore()
  store.ensureInitialized()
  const first = store.upsertDailyRecord({ date: '2026-10-16', weight: 66 })
  const second = store.upsertDailyRecord({ date: '2026-10-16', weight: 65.8, waterBottles: { 500: 2 } })
  assert.equal(first.id, second.id)
  assert.equal(store.getState().dailyRecords.length, 1)
  assert.equal(store.getState().dailyRecords[0].waterBottles[500], 2)
})

test('手机号注册状态保存在本机', () => {
  const store = createStore()
  store.ensureInitialized()
  store.updateProfile({ phone: '13800138000', registered: true })
  assert.equal(store.getState().profile.phone, '13800138000')
  assert.equal(store.getState().profile.registered, true)
})
