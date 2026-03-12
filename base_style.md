# 主屏幕设计风格指南

## 概述

本项目采用简约现代的设计风格，注重用户体验和视觉美感。设计语言融合了渐变色、圆角卡片、流畅动画等元素，营造出清新、专业的视觉效果。

## 色彩系统

### 主色调

```css
/* 主题渐变色 - 蓝紫色系 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--primary-color: #667eea;
--secondary-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
--secondary-color: #4facfe;

/* 辅助渐变色 */
--accent-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
```

### 中性色

```css
/* 背景色 */
--bg-color: #f5f7fa;
--card-bg: #ffffff;

/* 文字色 */
--text-primary: #1a1a1a;
--text-secondary: #1e293b;
--text-tertiary: #64748b;
--text-quaternary: #94a3b8;
--text-disabled: #999;

/* 边框色 */
--border-color: #e2e8f0;
```

### 状态色

```css
/* 成功色 */
--success-bg: #d1fae5;
--success-color: #059669;
--success-gradient: linear-gradient(90deg, #34d399, #10b981);

/* 警告色 */
--warning-bg: #fef3c7;
--warning-color: #d97706;
--warning-gradient: linear-gradient(90deg, #fbbf24, #f59e0b);

/* 错误色 */
--error-bg: #fee2e2;
--error-color: #dc2626;
--error-gradient: linear-gradient(90deg, #f87171, #ef4444);
```

### 阴影系统

```css
--shadow-sm: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
--shadow-md: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
--shadow-lg: 0 12rpx 40rpx rgba(0, 0, 0, 0.08);
--shadow-primary: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
--shadow-secondary: 0 8rpx 24rpx rgba(79, 172, 254, 0.3);
```

## 字体系统

### 字体家族

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
             'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
```

### 字体大小规范

| 用途 | 大小 | 字重 |
|------|------|------|
| 页面标题 | 48rpx | 700 |
| 章节标题 | 36rpx | 700 |
| 卡片数值 | 44-48rpx | 700 |
| 卡片标题 | 32rpx | 600 |
| 标签/徽章 | 24-28rpx | 600 |
| 正文 | 28-30rpx | 400 |
| 辅助文字 | 24-28rpx | 400 |
| 描述文字 | 28rpx | 400 |

## 圆角系统

```css
--radius-sm: 12rpx;   /* 标签、徽章 */
--radius-md: 16rpx;   /* Tab项 */
--radius-lg: 20rpx;   /* Tab容器 */
--radius-xl: 24rpx;   /* 卡片 */
--radius-2xl: 28rpx;  /* 大卡片/容器 */
--radius-full: 44rpx; /* 按钮 */
--radius-circle: 50%; /* 圆形 */
```

## 间距系统

```css
--spacing-xs: 8rpx;
--spacing-sm: 12rpx;
--spacing-md: 20rpx;
--spacing-lg: 24rpx;
--spacing-xl: 32rpx;
--spacing-2xl: 40rpx;
--spacing-3xl: 60rpx;
--spacing-4xl: 120rpx;
```

## 组件样式

### 页面容器

```css
.page-container {
  min-height: 100vh;
}

.content-wrapper {
  padding: 40rpx;
}
```

### 页面头部

```css
.page-header {
  margin-bottom: 40rpx;
  padding: 20rpx 0;
  animation: fadeIn 0.6s ease-out;
}

.page-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #1a1a1a;
  display: block;
  margin-bottom: 12rpx;
}

.page-subtitle {
  font-size: 28rpx;
  color: #999;
  display: block;
}
```

### Tab 切换器

```css
.tab-container {
  display: flex;
  background: white;
  border-radius: 20rpx;
  padding: 8rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: translateY(-4rpx);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}
```

### 卡片组件

#### 基础卡片

```css
.card {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.card:active {
  transform: translateY(-4rpx);
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.12);
}
```

#### 渐变数据卡片

```css
.data-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 40rpx 24rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.data-card:active {
  transform: translateY(-4rpx) scale(1.05);
  box-shadow: 0 16rpx 40rpx rgba(102, 126, 234, 0.4);
}

.data-card .value {
  font-size: 48rpx;
  font-weight: 700;
  color: white;
  display: block;
  margin-bottom: 12rpx;
}

.data-card .label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  display: block;
}
```

### 按钮组件

```css
.btn-primary {
  width: 300rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.btn-primary:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}
```

### 徽章组件

```css
.badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  transition: all 0.3s ease;
}

.badge-success {
  background: #d1fae5;
  color: #059669;
}

.badge-warning {
  background: #fef3c7;
  color: #d97706;
}

.badge-error {
  background: #fee2e2;
  color: #dc2626;
}
```

### 进度条

```css
.progress-bar-bg {
  height: 12rpx;
  background: #e2e8f0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s ease-out;
}
```

## 动画系统

### 基础动画

```css
/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 向上淡入动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滑入动画 */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

/* 呼吸动画 */
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 旋转动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### 动画时长

```css
--duration-fast: 0.2s;
--duration-base: 0.3s;
--duration-medium: 0.5s;
--duration-slow: 0.6s;
```

### 动画缓动

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

## 交互动效

### 点击反馈

```css
/* 卡片点击 */
.card:active {
  transform: translateY(-4rpx);
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.12);
}

/* 按钮点击 */
.btn:active {
  transform: scale(0.95);
}

/* 链接点击 */
.link:active {
  color: var(--primary-color);
  transform: translateX(4rpx);
}
```

### 悬浮效果

```css
/* 标题颜色变化 */
.card:active .title {
  color: #667eea;
}

/* 徽章放大 */
.card:active .badge {
  transform: scale(1.1);
}
```

## 加载状态

### 加载容器

```css
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;
  background: white;
  border-radius: 28rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.08);
}
```

### 加载动画

```css
.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 24rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #64748b;
}
```

## 空状态

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;
  background: white;
  border-radius: 28rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
  animation: breathe 2s ease-in-out infinite;
}

.empty-text {
  font-size: 32rpx;
  color: #64748b;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #94a3b8;
  margin-bottom: 40rpx;
}
```

## 列表样式

### 列表容器

```css
.list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
```

### 列表项

```css
.list-item {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 交错动画 */
.list-item:nth-child(1) {
  animation: fadeInUp 0.5s ease-out 0.6s both;
}
.list-item:nth-child(2) {
  animation: fadeInUp 0.5s ease-out 0.7s both;
}
.list-item:nth-child(3) {
  animation: fadeInUp 0.5s ease-out 0.8s both;
}
.list-item:nth-child(4) {
  animation: fadeInUp 0.5s ease-out 0.9s both;
}
.list-item:nth-child(5) {
  animation: fadeInUp 0.5s ease-out 1.0s both;
}
```

## 设计原则

### 1. 简约至上
- 去除不必要的装饰元素
- 保持界面清晰、整洁
- 突出核心内容

### 2. 渐变美学
- 合理使用渐变色增强视觉层次
- 避免过度使用，保持克制
- 渐变色与功能语义对应

### 3. 流畅交互
- 所有交互都有明确的反馈
- 动画时长控制在合理范围
- 使用缓动函数提升体验

### 4. 统一性
- 保持字体、颜色、间距的统一
- 组件样式可复用
- 遵循相同的设计语言

### 5. 响应式
- 适配不同屏幕尺寸
- 合理使用弹性布局
- 保持内容可读性

## 使用建议

### 渐变色使用场景
- 主要按钮和操作项
- 重要数据展示卡片
- 当前选中状态
- 高亮提示信息

### 阴影使用层级
- 小阴影：普通卡片、列表项
- 中阴影：Tab、按钮
- 大阴影：重要容器、弹窗

### 动画使用原则
- 入场动画：页面加载、内容切换
- 交互反馈：点击、按压
- 状态变化：加载中、错误提示
- 避免过度动画影响性能

---

*文档版本：v1.0*
*最后更新：2026-03-09*
