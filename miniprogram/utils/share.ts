// 小程序分享配置 —— 在每个页面的 onShareAppMessage / onShareTimeline 里复用。
//
// 用法示例：
//   import { makeShareToFriend, makeShareToTimeline } from '../../utils/share';
//
//   Page({
//     onShareAppMessage() {
//       return makeShareToFriend({
//         title: '看看我一天都花在哪了',
//         path:  '/pages/timeOverview/index',
//       });
//     },
//     onShareTimeline() {
//       return makeShareToTimeline({ title: '一日虚度 · 时间账本' });
//     },
//   });

const DEFAULT_TITLE = '一日虚度 · 时间去哪儿了';
const DEFAULT_PATH  = '/pages/timeOverview/index';

type FriendShareInput = {
  title?: string;
  path?: string;
  // WeChat 会自动截图，留空即可；若想指定封面可传入图片路径或临时文件路径
  imageUrl?: string;
};

export function makeShareToFriend(input: FriendShareInput = {}) {
  return {
    title:    input.title || DEFAULT_TITLE,
    path:     input.path  || DEFAULT_PATH,
    imageUrl: input.imageUrl,
  };
}

type TimelineShareInput = {
  title?: string;
  query?: string;       // 朋友圈回流时路径上的 query 字段，格式 "k1=v1&k2=v2"
  imageUrl?: string;
};

export function makeShareToTimeline(input: TimelineShareInput = {}) {
  return {
    title:    input.title || DEFAULT_TITLE,
    query:    input.query || '',
    imageUrl: input.imageUrl,
  };
}
