# 发布清单

上架 Chrome Web Store + 开源发布的所有待办事项。

## 开源准备

| 状态 | 事项 | 谁做 | 备注 |
|------|------|------|------|
| ✅ | MIT License 文件 | Claude | 已添加 |
| ✅ | package.json license 字段 | Claude | 已添加 |
| ✅ | 隐私政策 (PRIVACY.md) | Claude | 已添加，GitHub 链接待更新 |
| ⬜ | 确认 GitHub 仓库地址 | 你 | 更新 PRIVACY.md 里的链接 |
| ⬜ | 检查 .gitignore 无敏感文件 | Claude | 发布前检查 |
| ⬜ | 检查依赖库 license 兼容性 | Claude | 发布前检查 |
| ⬜ | README.md 完善 | Claude | 功能基本完成后写 |

## Chrome Web Store 上架

### 账号（你自己来）

| 状态 | 事项 | 备注 |
|------|------|------|
| ⬜ | 注册 Chrome Developer 账号 | https://chrome.google.com/webstore/devconsole — 需 Google 账号 + $5 |

### 素材准备（Claude 帮你做）

| 状态 | 事项 | 备注 |
|------|------|------|
| ⬜ | Store 图标 128×128 | 从 logo 素材生成 |
| ⬜ | 截图（至少 1 张，1280×800 或 640×400） | Puppeteer 截图或 playground 导出 |
| ⬜ | 宣传图 440×280（可选） | 小型推广磁贴 |
| ⬜ | 短描述（132 字符内） | 英文 |
| ⬜ | 详细描述 | 英文，说明功能、需自备 API key |
| ⬜ | 分类选择建议 | 建议选 "Productivity" 或 "Education" |

### 代码合规（Claude 帮你检查）

| 状态 | 事项 | 备注 |
|------|------|------|
| ⬜ | manifest.json 权限最小化 | 当前用了 storage / activeTab / scripting / host_permissions |
| ⬜ | 权限用途说明 | 提交时需要解释每个权限的用途 |
| ⬜ | 无远程代码加载 | 纯本地，应该没问题 |
| ⬜ | CSP 合规 | Content Security Policy 检查 |

### 提交（你自己来，Claude 帮你列好该怎么填）

| 状态 | 事项 | 备注 |
|------|------|------|
| ⬜ | 数据披露表 | Claude 提前列好每项该选什么 |
| ⬜ | 上传 zip + 填写信息 + 提交审核 | Developer Dashboard 操作 |
| ⬜ | 审核通过 / 处理拒绝反馈 | 首次审核 1-3 天起 |

## 时间线

不急，跟着开发节奏走：
1. **现在**：License + 隐私政策 ✅
2. **开发中**：随时可以创建 GitHub 仓库、注册开发者账号
3. **功能基本完成后**：准备素材、完善 README、检查合规
4. **准备上架时**：生成截图、写 store 文案、提交审核
