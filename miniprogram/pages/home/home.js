const { readCurrentLineup, getSquad, getStaff, formatFormation } = require('../../utils/cloud');

Page({
  data: {
    loading: true,
    error: '',
    formation: '',
    kitLabel: '',
    starters: [],
    bench: [],
    staff: [],
    reviewCount: 0,
    attendanceCount: 0,
    mvpVoteCount: 0
  },

  onLoad() {
    this.loadLineup();
  },

  onPullDownRefresh() {
    this.loadLineup().finally(() => wx.stopPullDownRefresh());
  },

  async loadLineup() {
    this.setData({ loading: true, error: '' });
    try {
      const snapshot = await readCurrentLineup();
      if (!snapshot) {
        this.setData({ loading: false, error: '云端暂无阵容数据。' });
        return;
      }
      const squad = getSquad(snapshot);
      this.setData({
        loading: false,
        formation: formatFormation(snapshot),
        kitLabel: snapshot.kit === 'away' ? '客场' : '主场',
        starters: squad.starters,
        bench: squad.bench,
        staff: getStaff(snapshot),
        reviewCount: Array.isArray(snapshot.reviewsData) ? snapshot.reviewsData.length : 0,
        attendanceCount: Array.isArray(snapshot.attendanceData) ? snapshot.attendanceData.length : 0,
        mvpVoteCount: Array.isArray(snapshot.mvpVotesData) ? snapshot.mvpVotesData.length : 0
      });
    } catch (error) {
      this.setData({
        loading: false,
        error: error && error.message ? error.message : '读取云端阵容失败。'
      });
    }
  }
});
