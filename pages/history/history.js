const store = require('../../utils/store')
const health = require('../../utils/health')

Page({
  data: {
    activeTab: 'daily',
    dailyRecords: [],
    injections: []
  },

  onShow() { this.loadRecords() },

  loadRecords() {
    const state = store.getState()
    const dailyRecords = [...state.dailyRecords]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(item => ({
        ...item,
        totalText: `${(item.totals || health.sumNutrients(item.foods)).protein}g 蛋白质 · ${(item.totals || health.sumNutrients(item.foods)).calories} kcal`,
        bowelText: Number(item.bowelCount) > 0 ? `${item.bowelCount} 次 · ${health.BRISTOL_LABELS[item.bristolType] || '未分型'}` : '未记录'
      }))
    const injections = [...state.injections].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    this.setData({ dailyRecords, injections })
  },

  changeTab(event) { this.setData({ activeTab: event.currentTarget.dataset.tab }) },

  deleteRecord(event) {
    const { type, id } = event.currentTarget.dataset
    wx.showModal({
      title: '删除这条记录？',
      content: '删除后无法恢复。',
      confirmColor: '#b53b45',
      success: result => {
        if (!result.confirm) return
        store.deleteRecord(type, id)
        this.loadRecords()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  }
})
