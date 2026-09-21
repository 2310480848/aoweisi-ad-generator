# AOWEISI AI Ad Generator

AOWEISI AI Ad Generator 是一款面向广告内容生产的桌面应用，帮助团队在同一个工作台内完成项目管理、素材整理、脚本创作、分镜制作以及 AI 图片和视频生成。

## 核心功能

- 管理广告项目、脚本、分镜和素材
- 使用 AI 辅助生成文案、图片和视频
- 支持图片、视频、音频等参考素材
- 配置不同的文本、图片和视频模型供应商
- 记录生成任务状态，集中管理生成结果
- 使用本地数据库和本地文件目录保存项目数据

## 技术架构

- Electron 桌面客户端
- TypeScript / Node.js
- Express API 服务
- SQLite 本地数据库
- Socket.IO 实时任务通信
- Vercel AI SDK 模型接入

## 项目目录

```text
scripts/        Electron 主进程和构建脚本
src/            后端服务、路由、Agent 和业务逻辑
data/web/       内置前端页面
data/serve/     编译后的后端服务
data/skills/    AI 技能和提示词配置
data/models/    本地模型文件
```

## 开发环境

- Windows、macOS 或 Linux
- Node.js 23.11.1 及以上
- Yarn

项目启动后，桌面客户端会同时运行本地 API 服务并加载内置前端页面。模型 API 地址、密钥及模型名称可在应用设置中配置。

## 数据说明

项目数据默认保存在本机，包括数据库、上传素材、生成结果和运行日志。请定期备份重要数据，不要将个人密钥、客户素材或本地数据库提交到公开仓库。

## License

本项目采用 [Apache License 2.0](LICENSE) 许可证，具体条款以仓库中的许可证文件为准。
