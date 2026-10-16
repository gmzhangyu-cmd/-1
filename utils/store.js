const STORAGE_KEY = 'tirzepatide-health-tracker-v1'

const DEFAULT_STATE = {
  version: 1,
  settings: {
    targets: { protein: 0, carbs: 0, fat: 0, calories: 0 },
    injectionIntervalDays: 7,
    medicationExpiryDate: ''
  },
  injections: [],
  dailyRecords: []
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeState(value) {
  const state = value && typeof value === 'object' ? value : {}
  return {
    version: 1,
    settings: {
      ...clone(DEFAULT_STATE.settings),
      ...(state.settings || {}),
      targets: {
        ...clone(DEFAULT_STATE.settings.targets),
        ...((state.settings && state.settings.targets) || {})
      }
    },
    injections: Array.isArray(state.injections) ? state.injections : [],
    dailyRecords: Array.isArray(state.dailyRecords) ? state.dailyRecords : []
  }
}

function getState() {
  return normalizeState(wx.getStorageSync(STORAGE_KEY))
}

function saveState(state) {
  const normalized = normalizeState(state)
  wx.setStorageSync(STORAGE_KEY, normalized)
  return normalized
}

function ensureInitialized() {
  if (!wx.getStorageSync(STORAGE_KEY)) saveState(DEFAULT_STATE)
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function upsertInjection(record) {
  const state = getState()
  const item = { ...record, id: record.id || makeId('inj'), updatedAt: Date.now() }
  const index = state.injections.findIndex(entry => entry.id === item.id)
  if (index >= 0) state.injections[index] = item
  else state.injections.unshift(item)
  if (item.expiryDate) state.settings.medicationExpiryDate = item.expiryDate
  saveState(state)
  return item
}

function upsertDailyRecord(record) {
  const state = getState()
  const item = { ...record, id: record.id || makeId('day'), updatedAt: Date.now() }
  const index = state.dailyRecords.findIndex(entry => entry.date === item.date)
  if (index >= 0) item.id = state.dailyRecords[index].id
  if (index >= 0) state.dailyRecords[index] = item
  else state.dailyRecords.unshift(item)
  saveState(state)
  return item
}

function deleteRecord(type, id) {
  const state = getState()
  if (type === 'injection') state.injections = state.injections.filter(item => item.id !== id)
  if (type === 'daily') state.dailyRecords = state.dailyRecords.filter(item => item.id !== id)
  saveState(state)
}

function updateSettings(settings) {
  const state = getState()
  state.settings = {
    ...state.settings,
    ...settings,
    targets: { ...state.settings.targets, ...(settings.targets || {}) }
  }
  return saveState(state).settings
}

function clearAll() {
  wx.setStorageSync(STORAGE_KEY, clone(DEFAULT_STATE))
}

module.exports = {
  STORAGE_KEY,
  clearAll,
  deleteRecord,
  ensureInitialized,
  getState,
  saveState,
  updateSettings,
  upsertDailyRecord,
  upsertInjection
}
