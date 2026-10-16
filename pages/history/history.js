const store = require('../../utils/store')
const health = require('../../utils/health')

Page({
  data: { activeTab: 'daily', dailyRecords: [], shots: [] },

  onShow() { this.loadRecords() },

  loadRecords() {
    const state = store.getState()
    const dailyRecords = [...state.dailyRecords].sort((a, b) => b.date.localeCompare(a.date)).map(item => ({
      ...item,
      bmiText: item.bmi || health.calculateBMI(item.weight, item.height) || '—',
      waterText: `${health.waterSummary(item.waterBottles).count} 瓶`,
      mealText: ['breakfast', 'lunch', 'dinner'].map(key => item.meals && item.meals[key]).filter(Boolean).join(' · ') || '三餐未记录',
      bowelText: Number(item.bowelCount) > 0 ? `${item.bowelCount} 次 · ${health.BRISTOL_LABELS[item.bristolType] || '未分型'}` : '未记录'
    }))
    const shots = [...state.shots].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    this.setData({ dailyRecords, shots })
  },

  changeTab(event) { this.setData({ activeTab: event.currentTarget.dataset.tab }) },

  deleteRecord(event) {
    const { type, id } = event.currentTarget.dataset
    wx.showModal({
      title: '删除这条记录？', content: '删除后无法恢复。', confirmColor: '#d75582',
      success: result => {
        if (!result.confirm) return
        store.deleteRecord(type, id)
        this.loadRecords()
        wx.showToast({ title: '已删除', icon: 'success', duration: 1000 })
      }
    })
  }
})
