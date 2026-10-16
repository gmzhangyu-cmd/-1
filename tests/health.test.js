const test = require('node:test')
const assert = require('node:assert/strict')
const health = require('../utils/health')

test('根据身高体重计算 BMI', () => {
  assert.equal(health.calculateBMI(60, 165), 22)
  assert.equal(health.calculateBMI('', 165), null)
})

test('计算药品有效期状态', () => {
  const now = new Date(2026, 9, 16, 12)
  assert.equal(health.expirySummary('2026-10-15', now).text, '已过期 1 天')
  assert.equal(health.expirySummary('2026-10-16', now).text, '今天到期')
  assert.equal(health.expirySummary('2026-10-26', now).text, '还有 10 天到期')
})

test('按最后一次记录与间隔计算计划日', () => {
  const result = health.nextShotSummary([
    { date: '2026-10-10', time: '20:00' },
    { date: '2026-10-09', time: '20:00' }
  ], 7, new Date(2026, 9, 16, 12))
  assert.equal(result.date, '2026-10-17')
  assert.equal(result.text, '距计划还有 1 天')
})

test('按四种瓶型统计饮水', () => {
  assert.deepEqual(health.waterSummary({ 100: 1, 300: 2, 500: 1, 1000: 1 }), { count: 5, total: 2200, liters: 2.2 })
})

test('体重变化返回短暂鼓励语', () => {
  assert.equal(health.weightFeedback(64.5, 65), '恭喜，离目标更近一步！')
  assert.equal(health.weightFeedback(65.5, 65), '波动很正常，坚持就是胜利。')
  assert.equal(health.weightFeedback(65, 65), '')
})

test('激励语共有 20 条并按 20 天重复', () => {
  assert.equal(health.MOTIVATION_QUOTES.length, 20)
  assert.equal(health.quoteForDate('2026-10-01'), health.quoteForDate('2026-10-21'))
})
