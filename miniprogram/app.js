const ENV_ID = 'laohe-wings-lineup-d3cz65831519b';

App({
  globalData: {
    envId: ENV_ID
  },
  onLaunch() {
    if (!wx.cloud) {
      console.warn('当前基础库不支持 wx.cloud');
      return;
    }
    wx.cloud.init({
      env: ENV_ID,
      traceUser: true
    });
  }
});
