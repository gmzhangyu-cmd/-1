const store = require('../../utils/store')
const health = require('../../utils/health')

Page({
  data: { settings: {}, stats: { daily: 0, shots: 0 }, profileLabel: '尚未注册' },

  onShow() { this.loadSettings() },

  loadSettings() {
    const state = store.getState()
    this.setData({
      settings: JSON.parse(JSON.stringify(state.settings)),
      stats: { daily: state.dailyRecords.length, shots: state.shots.length },
      profileLabel: state.profile.registered ? `${state.profile.phone.slice(0, 3)}****${state.profile.phone.slice(-4)}` : '尚未注册'
    })
  },

  onTargetInput(event) { this.setData({ [`settings.targets.${event.currentTarget.dataset.field}`]: event.detail.value }) },
  onFieldInput(event) { this.setData({ [`settings.${event.currentTarget.dataset.field}`]: event.detail.value }) },

  save() {
    const settings = this.data.settings
    const targets = {}
    Object.keys(settings.targets).forEach(key => { targets[key] = settings.targets[key] ? health.toNumber(settings.targets[key]) : '' })
    store.updateSettings({
      ...settings, targets,
      height: settings.height ? health.toNumber(settings.height) : '',
      shotIntervalDays: Math.max(1, Math.round(health.toNumber(settings.shotIntervalDays)))
    })
    this.loadSettings()
    wx.showToast({ title: '目标已保存', icon: 'success' })
  },

  goRegister() { wx.navigateTo({ url: '/pages/register/register' }) },
  goTrends() { wx.navigateTo({ url: '/pages/trends/trends' }) },

  copyBackup() {
    wx.setClipboardData({ data: JSON.stringify(store.getState(), null, 2), success: () => wx.showToast({ title: '数据已复制', icon: 'success' }) })
  },

  clearAll() {
    wx.showModal({
      title: '清空全部健康数据？', content: '身体、三餐、饮水和 💉 记录都会删除，且无法恢复。建议先复制数据。', confirmText: '确认清空', confirmColor: '#d45681',
      success: result => { if (result.confirm) { store.clearAll(); this.loadSettings(); wx.showToast({ title: '已清空', icon: 'success' }) } }
    })
  }
})
