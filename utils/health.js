function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function round(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor
}

function sumNutrients(foods = []) {
  return foods.reduce((total, food) => ({
    protein: round(total.protein + toNumber(food.protein)),
    carbs: round(total.carbs + toNumber(food.carbs)),
    fat: round(total.fat + toNumber(food.fat)),
    calories: round(total.calories + toNumber(food.calories), 0)
  }), { protein: 0, carbs: 0, fat: 0, calories: 0 })
}

function nutrientProgress(actual, target, unit = 'g') {
  const normalizedTarget = toNumber(target)
  const normalizedActual = toNumber(actual)
  if (normalizedTarget <= 0) {
    return { ratio: 0, percent: 0, status: '未设置', reached: false }
  }
  const ratio = normalizedActual / normalizedTarget
  return {
    ratio: round(ratio, 2),
    percent: Math.min(Math.round(ratio * 100), 100),
    status: ratio >= 1 ? '已达标' : `还差 ${round(normalizedTarget - normalizedActual)}${unit}`,
    reached: ratio >= 1
  }
}

function parseLocalDate(dateText) {
  if (!dateText) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function dateToISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayISO(now = new Date()) {
  return dateToISO(now)
}

function addDays(dateText, days) {
  const date = parseLocalDate(dateText)
  if (!date) return ''
  date.setDate(date.getDate() + toNumber(days))
  return dateToISO(date)
}

function daysFromToday(dateText, now = new Date()) {
  const date = parseLocalDate(dateText)
  if (!date) return null
  const today = parseLocalDate(todayISO(now))
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

function expirySummary(expiryDate, now = new Date()) {
  const days = daysFromToday(expiryDate, now)
  if (days === null) return { tone: 'muted', text: '尚未设置有效期', days: null }
  if (days < 0) return { tone: 'danger', text: `已过期 ${Math.abs(days)} 天`, days }
  if (days === 0) return { tone: 'danger', text: '今天到期', days }
  if (days <= 30) return { tone: 'warning', text: `还有 ${days} 天到期`, days }
  return { tone: 'success', text: `还有 ${days} 天到期`, days }
}

function latestInjection(injections = []) {
  return [...injections].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))[0] || null
}

function nextInjectionSummary(injections = [], intervalDays = 7, now = new Date()) {
  const latest = latestInjection(injections)
  if (!latest) return { date: '', text: '尚无注射记录', tone: 'muted', days: null }
  const date = addDays(latest.date, intervalDays)
  const days = daysFromToday(date, now)
  if (days < 0) return { date, text: `已超过计划 ${Math.abs(days)} 天`, tone: 'danger', days }
  if (days === 0) return { date, text: '计划今天注射', tone: 'warning', days }
  return { date, text: `距计划还有 ${days} 天`, tone: 'success', days }
}

const BRISTOL_LABELS = [
  '未记录',
  '1 型 · 分离硬块',
  '2 型 · 香肠状但结块',
  '3 型 · 表面有裂纹',
  '4 型 · 光滑柔软',
  '5 型 · 柔软小块',
  '6 型 · 糊状松散',
  '7 型 · 水样便'
]

module.exports = {
  BRISTOL_LABELS,
  addDays,
  daysFromToday,
  expirySummary,
  latestInjection,
  nextInjectionSummary,
  nutrientProgress,
  round,
  sumNutrients,
  todayISO,
  toNumber
}
