# 掰it — Claude 工作手册

> **新 session 第一件事：先看 [HANDOFF.md](./HANDOFF.md) 了解当前状态。**

## 项目简介

掰it 是一个纯本地的 Chrome 扩展，帮助用户在浏览英文网页时进行句子分块（chunking）和词汇学习。用户装完插件、填一个 LLM API key，就能用。零后端、零登录。

## 开发流程

遵循全局 CLAUDE.md 中的「标准开发流程」（6 步：需求对齐 → UI/交互设计 → 验收标准 → 技术方案 → 编码 → 验收确认）。

以下是本项目的补充规矩：

- **密钥安全**：代码和文档中不出现任何明文 key，密钥只存环境变量或用户本地配置
- **任务追踪**：用 GitHub Issues，不设单独的 workstreams 文件
- **并行开发**：按文件拆分 worktree，不按功能拆（避免多 worktree 改同一文件导致冲突）
- **测试纪律**：浏览器验收通过 Puppeteer 自动执行，不依赖用户手动操作

## 文档结构

| 文档 | 性质 | 作用 | 更新时机 |
|------|------|------|----------|
| **CLAUDE.md**（本文件） | 稳定 | 项目索引、项目特定规矩 | 规矩变化时 |
| **[HANDOFF.md](./HANDOFF.md)** | 易变 | 当前做到哪了、上次改了什么、下一步是什么 | 每个 session 结束时 |
| **[README.md](./README.md)** | 稳定 | 给用户看的安装、配置、使用说明 | 功能上线时 |
| **[docs/prd.md](./docs/prd.md)** | 较稳定 | 产品：用户痛点、设计原则、功能范围 | 产品方向变化时 |
| **[docs/design.md](./docs/design.md)** | 较稳定 | 设计：整体视觉风格、各模块 UI/交互设计 | 设计变化时 |
| **[docs/architecture.md](./docs/architecture.md)** | 较稳定 | 技术：架构、数据模型、模块设计、关键决策 | 技术方案变化时 |
| **[docs/testing.md](./docs/testing.md)** | 随开发演进 | 测试：验收标准、测试方法、测试基础设施 | 每个开发步骤开始前补充验收标准 |
| **[docs/publishing.md](./docs/publishing.md)** | 随发布推进 | 发布：Chrome Web Store 上架 + 开源发布的清单和进度 | 完成一项勾一项 |
