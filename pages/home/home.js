const store = require('../../utils/store')
const health = require('../../utils/health')

function latestDaily(records) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date))[0] || null
}

Page({
  data: {
    today: '',
    quote: '',
    nextShot: {},
    expiry: {},
    todayRecord: null,
    bodyItems: [],
    mealCount: 0,
    water: {},
    targetText: '',
    profileLabel: '手机号注册'
  },

  onShow() { this.loadDashboard() },

  loadDashboard() {
    const state = store.getState()
    const today = health.todayISO()
    const todayRecord = state.dailyRecords.find(item => item.date === today) || null
    const body = todayRecord || latestDaily(state.dailyRecords) || {}
    const height = body.height || state.settings.height
    const bmi = health.calculateBMI(body.weight, height)
    const bodyItems = [
      { label: '体重', value: body.weight ? `${body.weight} kg` : '—' },
      { label: 'BMI', value: bmi || '—' },
      { label: '体脂率', value: body.bodyFat ? `${body.bodyFat}%` : '—' },
      { label: '腰围', value: body.waist ? `${body.waist} cm` : '—' }
    ]
    const meals = todayRecord ? todayRecord.meals || {} : {}
    const mealCount = ['breakfast', 'lunch', 'dinner'].filter(key => String(meals[key] || '').trim()).length
    this.setData({
      today,
      quote: health.quoteForDate(today),
      nextShot: health.nextShotSummary(state.shots, state.settings.shotIntervalDays),
      expiry: health.expirySummary(state.settings.medicationExpiryDate),
      todayRecord,
      bodyItems,
      mealCount,
      water: health.waterSummary(todayRecord ? todayRecord.waterBottles : {}),
      targetText: health.metricDifference(body.weight, state.settings.targets.weight, 'kg'),
      profileLabel: state.profile.registered ? `${state.profile.phone.slice(0, 3)}****${state.profile.phone.slice(-4)}` : '手机号注册'
    })
  },

  goNeedle() { wx.switchTab({ url: '/pages/needle/needle' }) },
  goDaily() { wx.switchTab({ url: '/pages/daily/daily' }) },
  goTrends() { wx.navigateTo({ url: '/pages/trends/trends' }) },
  goRegister() { wx.navigateTo({ url: '/pages/register/register' }) }
})
