const store = require('../../utils/store')
const health = require('../../utils/health')

Page({
  data: {
    today: '',
    greeting: '',
    nextInjection: {},
    expiry: {},
    latestInjection: null,
    todayRecord: null,
    nutrientCards: [],
    weightText: '尚未记录',
    bowelText: '尚未记录'
  },

  onShow() {
    this.loadDashboard()
  },

  loadDashboard() {
    const state = store.getState()
    const today = health.todayISO()
    const todayRecord = state.dailyRecords.find(item => item.date === today) || null
    const latestInjection = health.latestInjection(state.injections)
    const totals = todayRecord ? health.sumNutrients(todayRecord.foods) : health.sumNutrients([])
    const target = state.settings.targets
    const definitions = [
      ['蛋白质', 'protein', 'g'],
      ['碳水', 'carbs', 'g'],
      ['脂肪', 'fat', 'g'],
      ['热量', 'calories', 'kcal']
    ]
    const nutrientCards = definitions.map(([label, key, unit]) => {
      const progress = health.nutrientProgress(totals[key], target[key], unit)
      return { label, key, unit, actual: totals[key], target: target[key], ...progress }
    })
    const hour = new Date().getHours()
    this.setData({
      today,
      greeting: hour < 11 ? '早上好' : hour < 18 ? '下午好' : '晚上好',
      nextInjection: health.nextInjectionSummary(state.injections, state.settings.injectionIntervalDays),
      expiry: health.expirySummary(state.settings.medicationExpiryDate),
      latestInjection,
      todayRecord,
      nutrientCards,
      weightText: todayRecord && todayRecord.weight ? `${todayRecord.weight} kg` : '尚未记录',
      bowelText: todayRecord && Number(todayRecord.bowelCount) > 0
        ? `${todayRecord.bowelCount} 次 · ${health.BRISTOL_LABELS[todayRecord.bristolType] || '未分型'}`
        : '尚未记录'
    })
  },

  goInjection() { wx.switchTab({ url: '/pages/injection/injection' }) },
  goDaily() { wx.switchTab({ url: '/pages/daily/daily' }) },
  goSettings() { wx.switchTab({ url: '/pages/settings/settings' }) }
})
