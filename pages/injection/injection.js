const store = require('../../utils/store')
const health = require('../../utils/health')

const SITES = ['腹部左侧', '腹部右侧', '左大腿', '右大腿', '左上臂', '右上臂', '其他']

Page({
  data: {
    sites: SITES,
    siteIndex: 0,
    form: {}
  },

  onLoad() { this.resetForm() },
  onShow() {
    if (!this.data.form.date) this.resetForm()
  },

  resetForm() {
    const now = new Date()
    this.setData({
      siteIndex: 0,
      form: {
        date: health.todayISO(now),
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        dosage: '',
        site: SITES[0],
        batchNumber: '',
        expiryDate: store.getState().settings.medicationExpiryDate || '',
        notes: ''
      }
    })
  },

  onFieldInput(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  onSiteChange(event) {
    const siteIndex = Number(event.detail.value)
    this.setData({ siteIndex, 'form.site': SITES[siteIndex] })
  },

  save() {
    const { form } = this.data
    if (!form.date || !form.time) {
      wx.showToast({ title: '请选择注射时间', icon: 'none' })
      return
    }
    if (!form.site) {
      wx.showToast({ title: '请选择注射部位', icon: 'none' })
      return
    }
    store.upsertInjection({ ...form, dosage: String(form.dosage).trim() })
    wx.showToast({ title: '已保存', icon: 'success' })
    this.resetForm()
  }
})
