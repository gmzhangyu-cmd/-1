const test = require('node:test')
const assert = require('node:assert/strict')
const health = require('../utils/health')

test('汇总多条食物的营养数据', () => {
  assert.deepEqual(health.sumNutrients([
    { protein: 20.2, carbs: 10, fat: 2, calories: 150 },
    { protein: '9.9', carbs: '30.5', fat: '5.2', calories: '220' }
  ]), { protein: 30.1, carbs: 40.5, fat: 7.2, calories: 370 })
})

test('判断营养目标是否达标并限制进度条宽度', () => {
  assert.deepEqual(health.nutrientProgress(80, 100), {
    ratio: 0.8, percent: 80, status: '还差 20g', reached: false
  })
  assert.equal(health.nutrientProgress(120, 100).percent, 100)
  assert.equal(health.nutrientProgress(120, 100).reached, true)
  assert.equal(health.nutrientProgress(1500, 1800, 'kcal').status, '还差 300kcal')
})

test('计算药品有效期状态', () => {
  const now = new Date(2026, 9, 16, 12)
  assert.equal(health.expirySummary('2026-10-15', now).text, '已过期 1 天')
  assert.equal(health.expirySummary('2026-10-16', now).text, '今天到期')
  assert.equal(health.expirySummary('2026-10-26', now).text, '还有 10 天到期')
})

test('按最后一次记录与间隔计算计划注射日', () => {
  const now = new Date(2026, 9, 16, 12)
  const result = health.nextInjectionSummary([
    { date: '2026-10-10', time: '20:00' },
    { date: '2026-10-09', time: '20:00' }
  ], 7, now)
  assert.equal(result.date, '2026-10-17')
  assert.equal(result.text, '距计划还有 1 天')
})
