function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function round(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor
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

function latestShot(shots = []) {
  return [...shots].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))[0] || null
}

function nextShotSummary(shots = [], intervalDays = 7, now = new Date()) {
  const latest = latestShot(shots)
  if (!latest) return { date: '', text: '尚无记录', tone: 'muted', days: null }
  const date = addDays(latest.date, intervalDays)
  const days = daysFromToday(date, now)
  if (days < 0) return { date, text: `已超过计划 ${Math.abs(days)} 天`, tone: 'danger', days }
  if (days === 0) return { date, text: '计划在今天', tone: 'warning', days }
  return { date, text: `距计划还有 ${days} 天`, tone: 'success', days }
}

function calculateBMI(weight, height) {
  const weightNumber = toNumber(weight)
  const heightNumber = toNumber(height)
  if (weightNumber <= 0 || heightNumber <= 0) return null
  return round(weightNumber / ((heightNumber / 100) ** 2), 1)
}

function waterTotal(bottles = {}) {
  return [100, 300, 500, 1000].reduce((total, size) => total + size * Math.max(0, toNumber(bottles[size])), 0)
}

function waterSummary(bottles = {}) {
  const count = Object.values(bottles).reduce((total, value) => total + Math.max(0, toNumber(value)), 0)
  const total = waterTotal(bottles)
  return { count, total, liters: round(total / 1000, 1) }
}

function weightFeedback(currentWeight, previousWeight) {
  const current = toNumber(currentWeight)
  const previous = toNumber(previousWeight)
  if (!current || !previous || current === previous) return ''
  return current < previous ? '恭喜，离目标更近一步！' : '波动很正常，坚持就是胜利。'
}

function metricDifference(current, target, unit) {
  const currentNumber = toNumber(current)
  const targetNumber = toNumber(target)
  if (!currentNumber || !targetNumber) return '待记录'
  const difference = round(currentNumber - targetNumber, 1)
  if (difference <= 0) return '已达到目标'
  return `距离目标 ${difference}${unit}`
}

const MOTIVATION_QUOTES = [
  '给身体多一点耐心',
  '今天的坚持，会被未来的你看见',
  '慢一点没关系，你一直在前进',
  '认真照顾自己，就是最好的进步',
  '每一个小选择，都在靠近更好的状态',
  '不追求完美，只坚持比昨天多一点',
  '身体的变化需要时间，也值得等待',
  '把目标拆小，把坚持变成日常',
  '稳定的节奏，比短暂的冲刺更有力量',
  '今天也为自己做一件健康的小事',
  '记录不是压力，是看见自己的方式',
  '允许波动，继续向前',
  '你不需要很快，只需要不停',
  '好好吃饭，好好生活，好好爱自己',
  '每一次重新开始，都算数',
  '温柔坚定，也是一种强大',
  '把注意力放在今天能做到的事',
  '改变正在发生，只是需要一点时间',
  '小小的进步，也值得认真庆祝',
  '坚持自己的节奏，你已经做得很好'
]

function quoteForDate(dateText = todayISO()) {
  const date = parseLocalDate(dateText) || new Date()
  const dayNumber = Math.floor(date.getTime() / 86400000)
  return MOTIVATION_QUOTES[((dayNumber % MOTIVATION_QUOTES.length) + MOTIVATION_QUOTES.length) % MOTIVATION_QUOTES.length]
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
  MOTIVATION_QUOTES,
  addDays,
  calculateBMI,
  daysFromToday,
  expirySummary,
  latestShot,
  metricDifference,
  nextShotSummary,
  quoteForDate,
  round,
  todayISO,
  toNumber,
  waterSummary,
  waterTotal,
  weightFeedback
}
