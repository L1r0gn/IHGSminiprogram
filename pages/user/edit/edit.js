Page({
  data: {
    userInfo: {}, // 仅用于表单绑定，初始为空
    genderOptions: ['男', '女'],
    userAttributeOptions: ['学生', '教师'],
    genderIndex: -1,
    userAttributeIndex: -1,
  },

  onLoad() {
    const app = getApp();
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('accessToken');

    if (!userId || !token) {
      wx.showToast({ title: '用户信息缺失', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    //发出请求
    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/edit/${userId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        //登录验证
        if (res.statusCode === 401) {
          wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
          wx.removeStorageSync('accessToken');
          wx.removeStorageSync('userId');
          wx.navigateTo({ url: '/pages/login/login' });
          return;
        }
        const user = res.data.user || {};
        const classList = res.data.classNameList || [];
        // 初始化性别索引
        const genderIndex = user.gender;
        // 初始化身份索引
        const userAttributeIndex =  user.user_attribute < 2 ? user.user_attribute : 0;
        // 初始化班级索引
        const classIndex = classList.findIndex(cls => cls.id === (user.class_in?.id));

        this.setData({
          userInfo: { ...user }, // 完全来自服务器
          classList,
          genderIndex: genderIndex >= 0 ? genderIndex : -1,
          userAttributeIndex: userAttributeIndex >= 0 ? userAttributeIndex : -1,
          classIndex: classIndex >= 0 ? classIndex : -1
        });
        console.log('收到用户数据：',this.data.userInfo);
        console.log('收到班级数据：',res.data.classNameList);
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  saveToServer() {
    const app = getApp();
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('accessToken');
    const { userInfo, genderIndex, userAttributeIndex} = this.data;
    // 获取班级 ID（如果选择了班级）
    const requestData = {
      gender: genderIndex,               // 后端是否接受 index？需确认
      attribute: userAttributeIndex,
      phone: userInfo.phone || '',
      nickName: userInfo.wx_nickName || '',
      avatarUrl: userInfo.wx_avatar || ''
    };

    console.log('提交数据:', requestData);
 
    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/edit/${userId}`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
      data: requestData,
      success: (res) => {
        if (res.statusCode === 401) {
          app.handleTokenExpired();
          return;
        }
        if (res.statusCode === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' });
          wx.navigateBack();
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('保存失败', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },
  onGenderChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      genderIndex: idx,
      'userInfo.gender': this.data.genderOptions[idx]
    });
  },

  onUserAttributeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      userAttributeIndex: idx,
      'userInfo.attribute': this.data.userAttributeOptions[idx]
    });
  },

  onClassChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      classIndex: idx,
      'userInfo.class_in': this.data.classList[idx] || null
    });
  },

  onNicknameInput(e) {
    this.setData({ 'userInfo.nickName': e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ 'userInfo.phone': e.detail.value });
  },

  showCreateClassModal() {
    this.setData({ showCreateModal: true, newClassName: '' });
  },

  hideCreateClassModal() {
    this.setData({ showCreateModal: false });
  },

  onClassInput(e) {
    this.setData({ newClassName: e.detail.value });
  },
  async createNewClass() {
    const name = this.data.newClassName.trim();
    if (!name) {
      wx.showToast({ title: '请输入班级名称', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('access_token');
    wx.showLoading({ title: '创建中...' });

    try {
      const res = await wx.request({
        url: `${app.globalData.globalUrl}/class/create/`,  // 接口路径需与后端路由对应
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { name }
      });

      if (res.statusCode === 200 && res.data.success) {
        wx.showToast({ title: res.data.message });
        // 关闭弹窗
        this.hideCreateClassModal();
        // 1. 将新班级加入 classList
        const newClass = res.data.class;
        const updatedList = [...this.data.classList, newClass];
        // 2. 自动选中新班级
        const newIndex = updatedList.length - 1;
        this.setData({
          classList: updatedList,
          classIndex: newIndex,
          'userInfo.class_in': newClass
        });
        // 3. 立即保存到用户资料（可选）
        this.saveUserEdit({ class_in_id: newClass.id });
      } else {
        wx.showToast({ title: res.data.error || '创建失败', icon: 'none' });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onNicknameInput(e) {
    const nickName = e.detail.value;
    this.setData({
      ['userInfo.nickName']: nickName 
    });
    console.log(nickName);
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('新头像临时路径:', avatarUrl);
    this.setData({
      ['userInfo.avatarUrl']: avatarUrl 
    });
  }
});