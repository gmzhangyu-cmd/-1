const test = require('node:test')
const assert = require('node:assert/strict')

function createStore() {
  const storage = new Map()
  global.wx = {
    getStorageSync(key) { return storage.get(key) },
    setStorageSync(key, value) { storage.set(key, JSON.parse(JSON.stringify(value))) }
  }
  delete require.cache[require.resolve('../utils/store')]
  return require('../utils/store')
}

test('初始化本地数据并保留默认目标', () => {
  const store = createStore()
  store.ensureInitialized()
  const state = store.getState()
  assert.equal(state.settings.targets.protein, 0)
  assert.deepEqual(state.injections, [])
})

test('保存注射记录时同步药品有效期', () => {
  const store = createStore()
  store.ensureInitialized()
  const item = store.upsertInjection({ date: '2026-10-16', time: '09:00', site: '腹部左侧', expiryDate: '2027-02-01' })
  const state = store.getState()
  assert.match(item.id, /^inj-/)
  assert.equal(state.injections.length, 1)
  assert.equal(state.settings.medicationExpiryDate, '2027-02-01')
})

test('同一天的每日记录会更新而不是重复新增', () => {
  const store = createStore()
  store.ensureInitialized()
  const first = store.upsertDailyRecord({ date: '2026-10-16', weight: 66, foods: [] })
  const second = store.upsertDailyRecord({ date: '2026-10-16', weight: 65.8, foods: [] })
  assert.equal(first.id, second.id)
  assert.equal(store.getState().dailyRecords.length, 1)
  assert.equal(store.getState().dailyRecords[0].weight, 65.8)
})

test('删除指定类型记录不会影响其他数据', () => {
  const store = createStore()
  store.ensureInitialized()
  const injection = store.upsertInjection({ date: '2026-10-16', time: '09:00' })
  store.upsertDailyRecord({ date: '2026-10-16', foods: [] })
  store.deleteRecord('injection', injection.id)
  assert.equal(store.getState().injections.length, 0)
  assert.equal(store.getState().dailyRecords.length, 1)
})
