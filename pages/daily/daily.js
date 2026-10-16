const store = require('../../utils/store')
const health = require('../../utils/health')

function blankFood() {
  return { name: '', protein: '', carbs: '', fat: '', calories: '' }
}

Page({
  data: {
    bowelCounts: ['0 次', '1 次', '2 次', '3 次', '4 次', '5 次', '6 次', '7 次', '8 次', '9 次', '10 次及以上'],
    bristolLabels: health.BRISTOL_LABELS,
    bowelCountIndex: 0,
    bristolIndex: 0,
    form: {},
    totals: { protein: 0, carbs: 0, fat: 0, calories: 0 },
    progress: []
  },

  onLoad() { this.loadDate(health.todayISO()) },

  loadDate(date) {
    const state = store.getState()
    const existing = state.dailyRecords.find(item => item.date === date)
    const form = existing ? JSON.parse(JSON.stringify(existing)) : {
      date,
      weight: '',
      water: '',
      foods: [blankFood()],
      bowelCount: 0,
      bristolType: 0,
      bowelNotes: '',
      notes: ''
    }
    if (!form.foods || !form.foods.length) form.foods = [blankFood()]
    this.setData({
      form,
      bowelCountIndex: Number(form.bowelCount) || 0,
      bristolIndex: Number(form.bristolType) || 0
    })
    this.refreshTotals()
  },

  onDateChange(event) { this.loadDate(event.detail.value) },

  onFieldInput(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  onFoodInput(event) {
    const { index, field } = event.currentTarget.dataset
    this.setData({ [`form.foods[${index}].${field}`]: event.detail.value })
    this.refreshTotals()
  },

  addFood() {
    this.setData({ 'form.foods': [...this.data.form.foods, blankFood()] })
  },

  removeFood(event) {
    const foods = this.data.form.foods.filter((_, index) => index !== Number(event.currentTarget.dataset.index))
    this.setData({ 'form.foods': foods.length ? foods : [blankFood()] })
    this.refreshTotals()
  },

  onBowelCountChange(event) {
    const value = Number(event.detail.value)
    this.setData({ bowelCountIndex: value, 'form.bowelCount': value })
  },

  onBristolChange(event) {
    const value = Number(event.detail.value)
    this.setData({ bristolIndex: value, 'form.bristolType': value })
  },

  refreshTotals() {
    const totals = health.sumNutrients(this.data.form.foods || [])
    const targets = store.getState().settings.targets
    const progress = [
      ['蛋白质', 'protein', 'g'], ['碳水', 'carbs', 'g'],
      ['脂肪', 'fat', 'g'], ['热量', 'calories', 'kcal']
    ].map(([label, key, unit]) => ({ label, key, unit, actual: totals[key], target: targets[key], ...health.nutrientProgress(totals[key], targets[key], unit) }))
    this.setData({ totals, progress })
  },

  save() {
    const form = this.data.form
    if (!form.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }
    const foods = form.foods
      .filter(food => food.name || food.protein || food.carbs || food.fat || food.calories)
      .map(food => ({
        name: String(food.name || '').trim(),
        protein: health.toNumber(food.protein),
        carbs: health.toNumber(food.carbs),
        fat: health.toNumber(food.fat),
        calories: health.toNumber(food.calories)
      }))
    store.upsertDailyRecord({
      ...form,
      weight: form.weight ? health.toNumber(form.weight) : '',
      water: form.water ? health.toNumber(form.water) : '',
      foods,
      totals: health.sumNutrients(foods)
    })
    wx.showToast({ title: '今日记录已保存', icon: 'success' })
    this.loadDate(form.date)
  }
})
