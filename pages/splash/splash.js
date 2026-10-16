const health = require('../../utils/health')

Page({
  data: {
    quote: '',
    leaving: false
  },

  onLoad() {
    this.setData({ quote: health.quoteForDate() })
    this.leaveTimer = setTimeout(() => this.setData({ leaving: true }), 1900)
    this.routeTimer = setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 2700)
  },

  onUnload() {
    clearTimeout(this.leaveTimer)
    clearTimeout(this.routeTimer)
  },

  skip() {
    wx.switchTab({ url: '/pages/home/home' })
  }
})
