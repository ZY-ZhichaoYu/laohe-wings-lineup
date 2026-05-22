const { readCurrentLineup, getDrawPool } = require('../../utils/cloud');

Page({
  data: {
    loading: true,
    error: '',
    pool: [],
    card: null
  },

  onLoad() {
    this.loadPool();
  },

  onPullDownRefresh() {
    this.loadPool().finally(() => wx.stopPullDownRefresh());
  },

  async loadPool() {
    this.setData({ loading: true, error: '' });
    try {
      const snapshot = await readCurrentLineup();
      const pool = snapshot ? getDrawPool(snapshot) : [];
      this.setData({
        loading: false,
        pool,
        card: pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
      });
    } catch (error) {
      this.setData({
        loading: false,
        error: error && error.message ? error.message : '读取卡池失败。'
      });
    }
  },

  drawCard() {
    const pool = this.data.pool || [];
    if (!pool.length) return;
    const card = pool[Math.floor(Math.random() * pool.length)];
    this.setData({ card });
  }
});
