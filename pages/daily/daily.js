const store = require('../../utils/store')
const health = require('../../utils/health')

const BOTTLES = [
  { size: 100, label: '100ml', className: 'bottle-xs' },
  { size: 300, label: '300ml', className: 'bottle-sm' },
  { size: 500, label: '500ml', className: 'bottle-md' },
  { size: 1000, label: '1000ml', className: 'bottle-lg' }
]

Page({
  data: {
    bowelCounts: ['0 次', '1 次', '2 次', '3 次', '4 次', '5 次', '6 次', '7 次', '8 次', '9 次', '10 次及以上'],
    bristolLabels: health.BRISTOL_LABELS,
    bowelCountIndex: 0,
    bristolIndex: 0,
    form: {},
    bmi: '—',
    bottleOptions: [],
    water: { count: 0, liters: 0 },
    feedbackMessage: ''
  },

  onLoad() { this.loadDate(health.todayISO()) },

  loadDate(date) {
    const state = store.getState()
    const existing = state.dailyRecords.find(item => item.date === date)
    const form = existing ? JSON.parse(JSON.stringify(existing)) : {
      date, height: state.settings.height || '', weight: '', bodyFat: '', waist: '', hip: '', thigh: '', upperArm: '',
      meals: { ...store.DEFAULT_MEALS }, waterBottles: { ...store.DEFAULT_BOTTLES },
      bowelCount: 0, bristolType: 0, bowelNotes: '', notes: ''
    }
    form.meals = { ...store.DEFAULT_MEALS, ...(form.meals || {}) }
    form.waterBottles = { ...store.DEFAULT_BOTTLES, ...(form.waterBottles || {}) }
    this.setData({ form, bowelCountIndex: Number(form.bowelCount) || 0, bristolIndex: Number(form.bristolType) || 0 })
    this.refreshComputed()
  },

  refreshComputed() {
    const bottles = this.data.form.waterBottles || {}
    this.setData({
      bmi: health.calculateBMI(this.data.form.weight, this.data.form.height) || '—',
      bottleOptions: BOTTLES.map(item => ({ ...item, count: Number(bottles[item.size]) || 0 })),
      water: health.waterSummary(bottles)
    })
  },

  onDateChange(event) { this.loadDate(event.detail.value) },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: event.detail.value })
    if (field === 'height' || field === 'weight') this.refreshComputed()
  },

  onMealInput(event) { this.setData({ [`form.meals.${event.currentTarget.dataset.meal}`]: event.detail.value }) },

  adjustBottle(event) {
    const size = Number(event.currentTarget.dataset.size)
    const change = Number(event.currentTarget.dataset.change)
    const current = Number(this.data.form.waterBottles[size]) || 0
    this.setData({ [`form.waterBottles[${size}]`]: Math.max(0, current + change) })
    this.refreshComputed()
  },

  onBowelCountChange(event) {
    const value = Number(event.detail.value)
    this.setData({ bowelCountIndex: value, 'form.bowelCount': value })
  },

  onBristolChange(event) {
    const value = Number(event.detail.value)
    this.setData({ bristolIndex: value, 'form.bristolType': value })
  },

  goTrends() { wx.navigateTo({ url: '/pages/trends/trends' }) },

  save() {
    const form = this.data.form
    const state = store.getState()
    const previous = state.dailyRecords
      .filter(item => item.date < form.date && Number(item.weight) > 0)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    const numberFields = ['height', 'weight', 'bodyFat', 'waist', 'hip', 'thigh', 'upperArm']
    const record = { ...form }
    numberFields.forEach(field => { record[field] = form[field] ? health.toNumber(form[field]) : '' })
    record.bmi = health.calculateBMI(record.weight, record.height)
    store.upsertDailyRecord(record)
    if (record.height) store.updateSettings({ height: record.height })
    const message = health.weightFeedback(record.weight, previous && previous.weight) || '记录已保存'
    clearTimeout(this.feedbackTimer)
    this.setData({ feedbackMessage: message })
    this.feedbackTimer = setTimeout(() => this.setData({ feedbackMessage: '' }), 1600)
    this.loadDate(form.date)
  },

  onUnload() { clearTimeout(this.feedbackTimer) }
})
