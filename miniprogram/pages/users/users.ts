import { createUser } from '../../utils/service';

const app = getApp<IAppOption>();

interface UserInfo {
  avatar_url: string;
  alias: string;
  open_id: string;
}

interface IUserInfo {
  avatarUrl: string;
  nickName: string;
}

interface IAmount {
  label: string;
  value: number;
}

interface IData {
  userInfo: IUserInfo;
  isNicknameSet: boolean;
  showingModal: string;
  tempUserInfo: IUserInfo;
  sponsorPayEnabled: boolean;
  amounts: IAmount[];
  sponsors: any[];
}

interface IProps {
  // Add any properties that might be passed to the component
}

interface IMethod {
  onContributionClick(): void;
  onAvatarClick(): void;
  onNicknameInput(e: any): void;
  onChooseAvatar(e: WechatMiniprogram.CustomEvent): void;
  onCancelEdit(): void;
  onSaveProfile(): Promise<void>;
  onHideModal(): void;
  onSponsorClick(): void;
  onSelectAmount(e: WechatMiniprogram.TouchEvent): void;
  onOtherAmountClick(): void;
  onDismissModal(): void;
  onAboutClick(): void;
}

Component<IData, IProps, IMethod>({
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },

  data: {
    userInfo: {
      avatarUrl: '',
      nickName: ''
    },
    isNicknameSet: false,
    showingModal: '',
    tempUserInfo: {
      avatarUrl: '',
      nickName: ''
    },
    sponsorPayEnabled: true,
    amounts: [
      { label: '￥6.66', value: 6.66 },
      { label: '￥16.66', value: 16.66 },
      { label: '￥66.66', value: 66.66 }
    ],
    sponsors: []
  },

  lifetimes: {
    attached() {
      // Load user info from storage if available
      const storedUserInfo = wx.getStorageSync('userInfo');
      console.log("load user info", storedUserInfo)
      if (storedUserInfo) {
        this.setData({
          'userInfo.avatarUrl': storedUserInfo.avatar_url === 'default' ? '' : storedUserInfo.avatar_url,
          'userInfo.nickName': storedUserInfo.alias,
        });
      }
    }
  },

  methods: {
    onAvatarClick() {
      this.setData({ showingModal: 'profile' });
    },

    onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        ['tempUserInfo.avatarUrl']: e.detail.avatarUrl,
        ['tempUserInfo.nickName']: this.data.userInfo.nickName
      });
    },

    onNicknameInput(e: any) {
      const { value } = e.detail;
      this.setData({
        ['tempUserInfo.nickName']: value,
        ['tempUserInfo.avatarUrl']: this.data.userInfo.avatarUrl
      });
    },

    onCancelEdit() {
      this.setData({
        showingModal: '',
        tempUserInfo: this.data.userInfo
      });
    },

    onHideModal() {
      this.setData({ showingModal: '' });
    },

    async onSaveProfile() {
      const { tempUserInfo } = this.data;

      console.log("tempUserInfo", tempUserInfo)
      
      if (!tempUserInfo.nickName.trim()) {
        wx.showToast({
          title: 'Please enter your nickname',
          icon: 'none'
        });
        return;
      }

      wx.showLoading({
        title: 'Saving...',
      });

      try {
        let avatarFileId = this.data.userInfo.avatarUrl || 'default';
        
        // Upload new avatar if changed
        if (tempUserInfo.avatarUrl && tempUserInfo.avatarUrl !== this.data.userInfo.avatarUrl) {
          const cloudPath = `images/${app.globalData.openId}/${Date.now()}.png`;
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempUserInfo.avatarUrl,
          });
          if (!uploadResult.fileID) {
            throw new Error('Failed to upload avatar');
          }
          avatarFileId = uploadResult.fileID;
        }

        // Update user info
        const user: UserInfo = {
          open_id: app.globalData.openId || '',
          avatar_url: avatarFileId,
          alias: tempUserInfo.nickName,
        };

        await createUser(user);
        app.globalData.userInfo = user;
        wx.setStorageSync('userInfo', user);

        this.setData({
          userInfo: {
            avatarUrl: avatarFileId === 'default' ? '' : avatarFileId,
            nickName: tempUserInfo.nickName,
          },
          showingModal: '',
          tempUserInfo: {
            avatarUrl: avatarFileId === 'default' ? '' : avatarFileId,
            nickName: tempUserInfo.nickName,
          }
        });

        wx.showToast({
          title: 'Profile updated',
          icon: 'success'
        });
      } catch (error) {
        console.error('Failed to update profile:', error);
        wx.showToast({
          title: 'Failed to update profile',
          icon: 'none'
        });
      } finally {
        wx.hideLoading();
      }
    },

    onSponsorClick() {
      this.setData({ showingModal: 'sponsor' });
    },

    onSelectAmount(e: WechatMiniprogram.TouchEvent) {
      const amount = e.currentTarget.dataset.amount;
      console.log('Selected amount:', amount);
      // Implement payment logic here
    },

    onOtherAmountClick() {
      // Implement custom amount input logic
      console.log('Other amount clicked');
    },

    onContributionClick() {
      wx.navigateTo({
        url: '/pages/users/contributions/contributions',
        events: {
          pageLoaded: () => {
            console.log('Contributions page loaded successfully');
          }
        },
        success: (res) => {
          console.log('Navigation to contributions page successful');
        },
        fail: (err) => {
          console.error('Navigation failed:', err);
          wx.showToast({
            title: 'Navigation failed',
            icon: 'none'
          });
        }
      });
    },

    onAboutClick() {
      wx.navigateTo({
        url: '/pages/users/about/about',
        events: {
          pageLoaded: () => {
            console.log('About page loaded successfully');
          }
        },
        success: (res) => {
          console.log('Navigation to about page successful');
        },
        fail: (err) => {
          console.error('Navigation failed:', err);
          wx.showToast({
            title: 'Navigation failed',
            icon: 'none'
          });
        }
      });
    },

    onDismissModal() {
      this.setData({ showingModal: '' });
    }
  }
});
