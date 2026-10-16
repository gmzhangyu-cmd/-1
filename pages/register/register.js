const store = require('../../utils/store')

Page({
  data: { phone: '', agreed: false, registered: false },

  onLoad() {
    const profile = store.getState().profile
    this.setData({ phone: profile.phone || '', registered: Boolean(profile.registered) })
  },

  onPhoneInput(event) { this.setData({ phone: event.detail.value.replace(/\D/g, '').slice(0, 11) }) },
  onAgreementChange(event) { this.setData({ agreed: event.detail.value.includes('agree') }) },

  register() {
    if (!/^1[3-9]\d{9}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
    }
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意本机存储说明', icon: 'none' }); return
    }
    store.updateProfile({ phone: this.data.phone, registered: true, registeredAt: Date.now() })
    this.setData({ registered: true })
    wx.showToast({ title: '注册成功', icon: 'success', duration: 1200 })
    setTimeout(() => wx.navigateBack(), 1300)
  }
})
