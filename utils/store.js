const STORAGE_KEY = 'tirzepatide-health-tracker-v1'

const DEFAULT_TARGETS = { weight: '', waist: '', hip: '', bodyFat: '' }
const DEFAULT_BOTTLES = { 100: 0, 300: 0, 500: 0, 1000: 0 }
const DEFAULT_MEALS = { breakfast: '', lunch: '', dinner: '' }
const DEFAULT_STATE = {
  version: 2,
  profile: { phone: '', registered: false },
  settings: {
    targets: DEFAULT_TARGETS,
    height: '',
    shotIntervalDays: 7,
    medicationExpiryDate: ''
  },
  shots: [],
  dailyRecords: []
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeTargets(targets = {}) {
  return Object.keys(DEFAULT_TARGETS).reduce((result, key) => {
    result[key] = targets[key] === undefined ? DEFAULT_TARGETS[key] : targets[key]
    return result
  }, {})
}

function migrateDailyRecord(record) {
  const oldFoodNames = Array.isArray(record.foods)
    ? record.foods.map(food => food.name).filter(Boolean).join('、')
    : ''
  return {
    ...record,
    height: record.height || '',
    bodyFat: record.bodyFat || '',
    waist: record.waist || '',
    hip: record.hip || '',
    thigh: record.thigh || '',
    upperArm: record.upperArm || '',
    meals: { ...DEFAULT_MEALS, ...(record.meals || {}), ...(oldFoodNames && !record.meals ? { lunch: oldFoodNames } : {}) },
    waterBottles: { ...DEFAULT_BOTTLES, ...(record.waterBottles || {}) }
  }
}

function normalizeState(value) {
  const state = value && typeof value === 'object' ? value : {}
  const oldSettings = state.settings || {}
  const shots = Array.isArray(state.shots) ? state.shots : (Array.isArray(state.injections) ? state.injections : [])
  return {
    version: 2,
    profile: { ...clone(DEFAULT_STATE.profile), ...(state.profile || {}) },
    settings: {
      ...clone(DEFAULT_STATE.settings),
      ...oldSettings,
      shotIntervalDays: oldSettings.shotIntervalDays || oldSettings.injectionIntervalDays || 7,
      targets: normalizeTargets(oldSettings.targets)
    },
    shots,
    dailyRecords: Array.isArray(state.dailyRecords) ? state.dailyRecords.map(migrateDailyRecord) : []
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
  const existing = wx.getStorageSync(STORAGE_KEY)
  saveState(existing || DEFAULT_STATE)
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function upsertShot(record) {
  const state = getState()
  const item = { ...record, id: record.id || makeId('shot'), updatedAt: Date.now() }
  const index = state.shots.findIndex(entry => entry.id === item.id)
  if (index >= 0) state.shots[index] = item
  else state.shots.unshift(item)
  if (item.expiryDate) state.settings.medicationExpiryDate = item.expiryDate
  saveState(state)
  return item
}

function upsertDailyRecord(record) {
  const state = getState()
  const item = migrateDailyRecord({ ...record, id: record.id || makeId('day'), updatedAt: Date.now() })
  const index = state.dailyRecords.findIndex(entry => entry.date === item.date)
  if (index >= 0) item.id = state.dailyRecords[index].id
  if (index >= 0) state.dailyRecords[index] = item
  else state.dailyRecords.unshift(item)
  saveState(state)
  return item
}

function deleteRecord(type, id) {
  const state = getState()
  if (type === 'shot') state.shots = state.shots.filter(item => item.id !== id)
  if (type === 'daily') state.dailyRecords = state.dailyRecords.filter(item => item.id !== id)
  saveState(state)
}

function updateSettings(settings) {
  const state = getState()
  state.settings = {
    ...state.settings,
    ...settings,
    targets: normalizeTargets({ ...state.settings.targets, ...(settings.targets || {}) })
  }
  return saveState(state).settings
}

function updateProfile(profile) {
  const state = getState()
  state.profile = { ...state.profile, ...profile }
  return saveState(state).profile
}

function clearAll() {
  wx.setStorageSync(STORAGE_KEY, clone(DEFAULT_STATE))
}

module.exports = {
  DEFAULT_BOTTLES,
  DEFAULT_MEALS,
  STORAGE_KEY,
  clearAll,
  deleteRecord,
  ensureInitialized,
  getState,
  saveState,
  updateProfile,
  updateSettings,
  upsertDailyRecord,
  upsertShot
}
