const store = require('../../utils/store')
const health = require('../../utils/health')

Page({
  data: {
    settings: {},
    stats: { daily: 0, injections: 0 }
  },

  onShow() { this.loadSettings() },

  loadSettings() {
    const state = store.getState()
    this.setData({
      settings: JSON.parse(JSON.stringify(state.settings)),
      stats: { daily: state.dailyRecords.length, injections: state.injections.length }
    })
  },

  onTargetInput(event) {
    this.setData({ [`settings.targets.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  onFieldInput(event) {
    this.setData({ [`settings.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  save() {
    const settings = this.data.settings
    const targets = {}
    Object.keys(settings.targets).forEach(key => { targets[key] = health.toNumber(settings.targets[key]) })
    const interval = Math.max(1, Math.round(health.toNumber(settings.injectionIntervalDays)))
    store.updateSettings({ ...settings, targets, injectionIntervalDays: interval })
    this.loadSettings()
    wx.showToast({ title: '设置已保存', icon: 'success' })
  },

  copyBackup() {
    const payload = JSON.stringify(store.getState(), null, 2)
    wx.setClipboardData({
      data: payload,
      success: () => wx.showToast({ title: '备份已复制', icon: 'success' })
    })
  },

  clearAll() {
    wx.showModal({
      title: '清空全部健康数据？',
      content: '注射、体重、饮食和排便记录都会被删除，且无法恢复。建议先复制备份。',
      confirmText: '确认清空',
      confirmColor: '#b53b45',
      success: result => {
        if (!result.confirm) return
        store.clearAll()
        this.loadSettings()
        wx.showToast({ title: '数据已清空', icon: 'success' })
      }
    })
  }
})
