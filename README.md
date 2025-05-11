# 机器人远见家 (Robot Visionary)

这是一个机器人能力评估平台，用于评估机器人的感知、行为和因果性等方面的能力。

## 功能特点

- 从预设图片库随机选择3个机器人进行评估
- 使用滑块来对不同方面的能力进行评分
- 生成综合评分和详细评估报告
- 导出评估数据为CSV格式，方便后续分析

## 如何使用

1. 将需要评估的机器人图片放入 `/public/robot-images` 目录
2. 在 `src/config/robots.ts` 文件中更新机器人图片配置
3. 运行应用程序
4. 按照界面指引对随机选择的机器人进行评估
5. 完成评估后，下载CSV评估数据

## 开发说明

### 安装依赖
```
npm install
```

### 开发环境运行
```
npm run dev
```

### 构建生产版本
```
npm run build
```

### 部署说明

可以使用以下方式部署：

1. 使用GitHub Pages
2. 使用Firebase Hosting
3. 使用Vercel或Netlify等静态网站托管服务

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI 组件库

## 许可证

本项目采用 **知识共享署名-非商业性使用-禁止演绎 4.0 国际许可协议（CC BY-NC-ND 4.0）**，附带特殊的学术引用要求：

- **署名**：必须给出适当的署名，提供指向原始仓库的链接
- **非商业性使用**：禁止将本软件用于商业目的
- **禁止演绎**：禁止修改、转换或基于本作品创建衍生作品
- **学术引用**：任何使用或引用本软件的学术论文、出版物必须引用原作者

详细信息请查看[LICENSE](./LICENSE)文件和[Creative Commons官方网站](https://creativecommons.org/licenses/by-nc-nd/4.0/)。

## 引用格式

如果您在学术或研究工作中使用本项目，请使用以下格式进行引用：

```
作者姓名. (年份). 机器人远见家: 机器人能力评估平台. [软件]. GitHub: https://github.com/your-username/robot-visionary
```

Copyright © 2023-2024 智视未来. 保留所有权利。
