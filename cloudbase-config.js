window.LAOHE_CLOUDBASE_CONFIG = {
  enabled: true,
  envId: 'laohe-wings-lineup-d3cz65831519b',
  region: 'ap-shanghai',
  collection: 'lineups',
  currentDocId: 'current',
  publishFunction: 'publishLineup',
  publishHttpPath: 'https://laohe-wings-lineup-d3cz65831519b-1429692601.ap-shanghai.app.tcloudbase.com/api/publishLineup',
  publishFunctionType: 'auto',
  publishFunctionPath: '/',
  // 注意：static.cloudbase.net 上带版本号的路径（如 /2.17.5/）与 /latest/ 是不同的构建分支，
  // 直接改成某个版本号可能换成另一套 SDK 从而破坏云同步。若要锁版本，务必先把改后的 URL 在
  // 线上实测一遍（能正常发布/同步/评价再提交）。这里暂保持 latest。
  sdkUrl: 'https://static.cloudbase.net/cloudbase-js-sdk/latest/cloudbase.full.js',
  cloudHosts: [
    'laohe-wings-lineup-d3cz65831519b-1429692601.tcloudbaseapp.com',
    'laohe-wings-lineup-d3cz65831519b-1429692601.ap-shanghai.app.tcloudbase.com'
  ]
};
