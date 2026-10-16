const store = require('../../utils/store')
const health = require('../../utils/health')

const METRICS = [
  { key: 'weight', label: '体重', unit: 'kg' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'bodyFat', label: '体脂率', unit: '%' },
  { key: 'waist', label: '腰围', unit: 'cm' },
  { key: 'hip', label: '臀围', unit: 'cm' }
]

Page({
  data: {
    metrics: METRICS,
    activeKey: 'weight',
    activeMetric: METRICS[0],
    points: [],
    summaries: [],
    hasData: false,
    canvasWidth: 300,
    canvasHeight: 230
  },

  onShow() { this.loadData() },

  loadData() {
    const records = [...store.getState().dailyRecords].sort((a, b) => a.date.localeCompare(b.date))
    this.records = records
    const summaries = METRICS.map(metric => {
      const points = this.pointsFor(metric.key)
      const latest = points[points.length - 1]
      const first = points[0]
      const change = latest && first && points.length > 1 ? health.round(latest.value - first.value, 1) : null
      return { ...metric, latest: latest ? latest.value : '—', changeText: change === null ? '暂无变化' : `${change > 0 ? '+' : ''}${change}${metric.unit}` }
    })
    this.setData({ summaries })
    this.selectMetricByKey(this.data.activeKey)
  },

  pointsFor(key) {
    return this.records.map(record => {
      const value = key === 'bmi' ? (record.bmi || health.calculateBMI(record.weight, record.height)) : record[key]
      return { date: record.date, value: Number(value) }
    }).filter(point => Number.isFinite(point.value) && point.value > 0)
  },

  selectMetric(event) { this.selectMetricByKey(event.currentTarget.dataset.key) },

  selectMetricByKey(key) {
    const activeMetric = METRICS.find(item => item.key === key) || METRICS[0]
    const points = this.pointsFor(activeMetric.key)
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const canvasWidth = windowInfo.windowWidth - 56
    this.setData({ activeKey: activeMetric.key, activeMetric, points, hasData: points.length > 0, canvasWidth }, () => {
      if (points.length) setTimeout(() => this.drawChart(points, activeMetric), 30)
    })
  },

  drawChart(points, metric) {
    const width = this.data.canvasWidth
    const height = this.data.canvasHeight
    const padding = { left: 42, right: 18, top: 28, bottom: 38 }
    const values = points.map(item => item.value)
    let min = Math.min(...values)
    let max = Math.max(...values)
    const range = max - min || Math.max(max * 0.08, 1)
    min -= range * 0.18
    max += range * 0.18
    const plotWidth = width - padding.left - padding.right
    const plotHeight = height - padding.top - padding.bottom
    const xAt = index => padding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
    const yAt = value => padding.top + ((max - value) / (max - min)) * plotHeight
    const ctx = wx.createCanvasContext('trendCanvas', this)
    ctx.setStrokeStyle('#f2dfe6')
    ctx.setLineWidth(1)
    for (let index = 0; index < 4; index += 1) {
      const y = padding.top + (plotHeight / 3) * index
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(width - padding.right, y); ctx.stroke()
    }
    ctx.setStrokeStyle('#df668f')
    ctx.setLineWidth(3)
    ctx.setLineJoin('round')
    ctx.beginPath()
    points.forEach((point, index) => {
      const x = xAt(index); const y = yAt(point.value)
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()
    points.forEach((point, index) => {
      const x = xAt(index); const y = yAt(point.value)
      ctx.setFillStyle('#fff'); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
      ctx.setStrokeStyle('#df668f'); ctx.setLineWidth(3); ctx.stroke()
      ctx.setFillStyle('#765762'); ctx.setFontSize(11); ctx.setTextAlign('center')
      ctx.fillText(`${point.value}${metric.unit}`, x, Math.max(14, y - 12))
    })
    ctx.setFillStyle('#a18892'); ctx.setFontSize(10); ctx.setTextAlign('center')
    const labelIndexes = points.length <= 3 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1]
    labelIndexes.forEach(index => ctx.fillText(points[index].date.slice(5), xAt(index), height - 12))
    ctx.draw()
  }
})
