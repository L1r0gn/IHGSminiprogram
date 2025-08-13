Page({
  data: {
    userInfo: {},
    userDetail: {},
    classList: [],
    genderOptions: ['男', '女'],  // 性别选项
    genderIndex: 2,  // 默认性别索引
    userAttributeOptions: ['学生', '教师'],  // 用户身份选项
    userAttributeIndex: 2,  // 默认身份索引
  },
  
  onLoad() {
    // 获取信息
    const app = getApp();
    const userId = wx.getStorageSync('userId');
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) { this.setData({ userInfo: userInfo }); }
    
    // GET信息
    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/edit/${userId}`,
      method: 'GET',
      success: (res) => {
        console.log(res);
        this.setData({
          classList: res.data.classNameList,
          userDetail: res.data.user
        });
        console.log(this.data.classList);
        console.log(this.data.userDetail);
      },
      fail: (err) => {
        console.error('请求失败', err);
      }
    });
  },

  saveToServer() {
    const app = getApp();
    const userId = wx.getStorageSync('userId');
    const { userInfo } = this.data;
    const requestData = {
      gender: userInfo.gender,  // 用户选择的性别
      attribute: userInfo.attribute,  // 用户选择的身份
      class_in: userInfo.class_in && userInfo.class_in.id,  // 用户选择的班级ID
      phone: userInfo.phone,  // 用户修改后的手机号
      nickName: userInfo.nickName,  // 用户修改后的昵称
      avatarUrl: userInfo.avatarUrl  // 用户修改后的头像URL
    };
    console.log("请求的数据：", requestData);  // 打印数据，方便调试
    // 发起 POST 请求，将数据提交到服务器
    wx.request({
      url: `${app.globalData.globalUrl}/user/wx/edit/${userId}`,  // 服务器接口
      method: 'POST',
      data: requestData,  // 发送的数据
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          });
          wx.setStorageSync('userInfo', this.data.userInfo);
          this.setData({ classList: res.data.classNameList });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        console.error('请求失败', err);
        wx.showToast({
          title: '请求失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  // 性别选择变化
  onGenderChange(e) {
    const selectedGenderIndex = e.detail.value;  // 获取选择的性别索引
    const selectedGender = this.data.genderOptions[selectedGenderIndex];  // 获取选择的性别
    this.setData({
      genderIndex: selectedGenderIndex,  // 更新性别索引
      'userInfo.gender': selectedGender  // 更新 userInfo 中的性别信息
    });
    console.log(this.data.userInfo.gender);  // 打印选中的性别
  },

  // 用户身份选择变化（学生或教师）
  onUserAttributeChange(e) {
    const selectedAttributeIndex = e.detail.value;  // 获取选择的身份索引
    const selectedAttribute = this.data.userAttributeOptions[selectedAttributeIndex];  // 获取选择的身份
    this.setData({
      userAttributeIndex: selectedAttributeIndex,  // 更新身份索引
      'userInfo.attribute': selectedAttribute  // 更新 userInfo 中的身份信息
    });
    console.log(this.data.userInfo.attribute);  // 打印选中的身份
  },

  // 班级选择变化
  onClassChange(e) {
    const selectedClassIndex = e.detail.value;  // 获取选择的班级索引
    const selectedClass = this.data.classList[selectedClassIndex];  // 获取选择的班级对象
    this.setData({
      classIndex: selectedClassIndex,  // 更新班级索引
      'userInfo.class_in': selectedClass  // 更新 userInfo 中的班级信息
    });
    console.log(this.data.userInfo.class_in);  // 打印选中的班级
  }
});
