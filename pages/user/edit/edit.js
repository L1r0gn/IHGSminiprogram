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
    
    // 权限检查
    if (this.data.userInfo.user_attribute < 2) {
       // 注意：这里 user_attribute < 2 表示学生(0)或普通老师(1)，假设只有特定权限老师才能创建
       // 根据 prompt，user_attribute >= 2 才能创建
       // 如果 user_attribute=1 也是老师，需要确认后端逻辑。Prompt 说 user_attribute >= 2
       wx.showToast({ title: '权限不足，无法创建班级', icon: 'none' });
       return;
    }

    const token = wx.getStorageSync('accessToken'); // 修正：原代码用的 access_token，这里统一用 accessToken
    wx.showLoading({ title: '创建中...' });

    try {
      const app = getApp(); // 确保 app 定义
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.globalUrl}/class/create/`,  // 接口路径需与后端路由对应
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { name },
          success: resolve,
          fail: reject
        })
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
        // this.saveUserEdit({ class_in_id: newClass.id });
      } else if (res.statusCode === 403) {
        wx.showToast({ title: '权限不足', icon: 'none' });
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
    
    // 立即更新视图
    this.setData({
      ['userInfo.wx_avatar']: avatarUrl // 更新 WXML 使用的字段
    });

    // 立即上传获取永久 URL
    this.uploadAvatar(avatarUrl);
  },

  uploadAvatar(tempPath) {
    const app = getApp();
    const token = wx.getStorageSync('accessToken');
    
    wx.showLoading({ title: '上传头像中...' });

    wx.uploadFile({
      url: `${app.globalData.globalUrl}/user/wx/upload/avatar/`, // 假设后端有此上传接口
      filePath: tempPath,
      name: 'avatar', // 对应后端接收的文件字段名
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        console.log('上传结果:', res);
        
        // wx.uploadFile 返回的 data 是 string 类型
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          console.error('解析上传响应失败', e);
          wx.showToast({ title: '上传失败', icon: 'none' });
          return;
        }

        if (res.statusCode === 200 && data.url) {
           console.log('头像上传成功，永久URL:', data.url);
           // 将永久 URL 更新到 userInfo 中，以便 saveToServer 提交
           this.setData({
             ['userInfo.wx_avatar']: data.url
           });
           wx.showToast({ title: '头像上传成功', icon: 'success' });
        } else {
           wx.showToast({ title: data.message || '上传失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传头像失败', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});