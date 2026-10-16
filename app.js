const store = require('./utils/store')

App({
  onLaunch() {
    store.ensureInitialized()
  },
  globalData: {
    appName: '轻记健康'
  }
})
