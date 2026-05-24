# VX Exchange — 虚拟创业证券交易所

这是一个可部署的虚拟 Stock Exchange 平台 MVP：用户可以注册、创建虚拟企业、申请上市、管理员审核、IPO 认购、买卖虚拟股票、查看持仓和排行榜。

> 说明：本项目只用于虚拟交易、教育、游戏和模拟平台，不处理真实资金、真实证券或真实股权。

## 功能

- 用户登录 / 注册
- 初始虚拟资金：VX 100,000
- 市场行情与股票交易
- 创始人创建公司并提交上市申请
- 管理员审核公司并开启 IPO
- IPO 认购
- 虚拟持仓、交易记录、收益率
- 投资者排行榜
- 本地 Demo 模式 + Supabase 多人模式

## 文件结构

```text
vx-exchange/
├── index.html
├── config.js
├── config.example.js
├── assets/
│   ├── styles.css
│   └── app.js
├── supabase/
│   └── schema.sql
├── .nojekyll
└── README.md
```

## 本地预览

直接打开 `index.html` 即可进入本地 Demo 模式。

本地 Demo 管理员账号：

```text
Email: admin@vx.local
Password: admin123
```

本地 Demo 数据只存在当前浏览器的 localStorage，换设备不会同步。要让其他用户真正参与，需要配置 Supabase。

## Supabase 多人版部署

### 1. 创建 Supabase 项目

进入 Supabase Dashboard，新建 Project。

### 2. 运行数据库脚本

打开：

```text
Supabase Dashboard → SQL Editor → New query
```

把 `supabase/schema.sql` 里的内容完整粘贴进去并运行。

### 3. 获取 API 信息

进入：

```text
Project Settings → API
```

复制：

```text
Project URL
anon public key
```

### 4. 修改 config.js

把：

```js
window.VX_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: ''
};
```

改成：

```js
window.VX_CONFIG = {
  SUPABASE_URL: 'https://你的项目ID.supabase.co',
  SUPABASE_ANON_KEY: '你的 anon public key'
};
```

注意：不要把 `service_role` key 放进前端或 GitHub。

### 5. 设置管理员

先在网页注册你的账号。然后回到 Supabase SQL Editor，执行：

```sql
update public.profiles set role = 'admin' where email = '你的邮箱@example.com';
```

然后刷新网页，你就会看到管理员后台。

## 部署到 GitHub Pages

### 方法 A：直接上传

1. 新建一个 GitHub repository，例如 `vx-exchange`
2. 上传本项目所有文件，确保 `index.html` 在仓库根目录
3. 进入仓库 `Settings → Pages`
4. Source 选择 `Deploy from a branch`
5. Branch 选择 `main`，Folder 选择 `/root`
6. 保存后等待部署完成

### 方法 B：命令行上传

```bash
git init
git add .
git commit -m "Initial VX Exchange MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vx-exchange.git
git push -u origin main
```

然后到 GitHub 仓库的 `Settings → Pages` 启用 Pages。

## 当前版本限制

这个版本是 MVP，重点是完整闭环：公司创建 → 管理员审核 → IPO → 虚拟交易 → 持仓 → 排行榜。

后续可以继续升级：

- 真实订单簿撮合引擎
- K 线图与历史价格表
- 公司公告和评论区
- 反作弊系统
- 做市商机器人
- 任务、徽章和等级系统
- 邮件通知
- Supabase Edge Functions 增强风控

## 安全提醒

当前 Supabase 版本已经把买卖、IPO 认购和审核放进数据库 RPC 函数里，避免用户直接从前端随意改余额。但这仍然是虚拟模拟平台，不应接入真实资金或真实证券。
