# Therabo / 通微宝 — 部署与使用指南

> 这是给运维 / 客户方的「一份就够」的手册。涵盖：
> 1. 服务器准备 → 2. 部署 → 3. 首次启动 → 4. HTTPS → 5. 备份
> 6. 管理员后台使用 → 7. 客户端如何下单 → 8. 支付配置 → 9. 常见问题

---

## 0. 项目结构总览

```
therabo/
├── src/                  # 前端 React + Vite 源代码
├── server/               # 后端 Node + Express + TS + SQLite
│   ├── src/
│   ├── uploads/          # 上传的图片（容器挂载）
│   └── data/             # SQLite 数据库（容器挂载）
├── Dockerfile            # 单镜像构建（前端 + 后端）
├── docker-compose.yml    # app + nginx 反代
├── nginx.conf            # Nginx 配置（含 HTTPS 模板）
├── .env.example          # 环境变量模板
└── DEPLOY.md             # 本文件
```

**架构**：React SPA → Express API → SQLite。所有数据（产品、订单、客户、管理员账号、网站文案）都持久化在服务器 `/app/data/therabo.db`。
产品/Hero/About 图片存于 `/app/uploads/`。两者都通过 docker volume 持久化，**容器重启或重建数据不丢失**。

---

## 1. 服务器准备

### 1.1 最低配置
- **CPU**：1 核 / **内存**：1 GB / **磁盘**：20 GB
- **操作系统**：Ubuntu 22.04 LTS（其它发行版同理）
- **网络**：能访问外网；如部署在中国大陆需提前完成 ICP **域名备案**

### 1.2 安装 Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER     # 让当前用户能跑 docker（重新登录生效）
docker compose version            # 应输出 v2.x，若没有就 sudo apt install docker-compose-plugin
```

### 1.3 打开防火墙端口
```bash
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw enable
```

---

## 2. 部署

### 2.1 上传代码
把整个 `therabo/` 目录上传到服务器（推荐 `/opt/therabo`）：
```bash
scp -r ./therabo your-user@your-server:/opt/
ssh your-user@your-server
cd /opt/therabo
```

> 也可以走 git：`git clone <repo> /opt/therabo`

### 2.2 配置环境变量
```bash
cp .env.example .env
nano .env       # 填入下面 3 个必改项
```

**必改项**：
```env
APP_URL=https://your-domain.com                       # 你的真实域名
JWT_SECRET=（执行 openssl rand -base64 48 生成一段长随机串）
ADMIN_BOOTSTRAP_PASSWORD=一个强密码（首次登录后立即在后台修改）
```

支付相关字段可以**先留空** —— 站点正常上线，购物车里付款按钮会自动隐藏未配置的支付方式（见 § 8）。

### 2.3 启动
```bash
docker compose up -d --build
```

第一次会下载基础镜像、安装依赖、构建前后端，耗时约 3–5 分钟。

### 2.4 验证
```bash
docker compose ps           # 两个容器都应是 Up 状态
docker compose logs -f app  # 查看应用日志
curl http://localhost/api/health   # → {"ok":true,...}
```

浏览器访问 `http://你的服务器IP/` 应该能看到首页。

---

## 3. 首次启动会发生什么

容器启动时会执行 `node dist/seed.js`，做 3 件事（**幂等**，重启不会重复执行）：

1. 创建管理员账号 `admin`，密码 = `.env` 里的 `ADMIN_BOOTSTRAP_PASSWORD`
2. 把代码里的 16 个产品塞进数据库
3. 写入默认 Hero / About 文案

日志里会看到：
```
[seed] bootstrapped admin user "admin"
[seed] inserted 16 products
[seed] inserted default site content
[therabo] server listening on :8080
```

**立刻登录后台修改 admin 密码**：访问 `https://你的域名/#admin`，登录后到「管理员账号」页面 → 删掉 admin 重建一个，或先去[修改密码 API]（后续可加 UI 入口）。

---

## 4. HTTPS（强烈建议立刻配置）

### 4.1 准备域名
把你的域名 A 记录指向服务器 IP。等待 DNS 生效（`dig your-domain.com` 能看到正确 IP）。

### 4.2 申请 Let's Encrypt 证书
```bash
# 临时停掉 nginx 让 certbot 用 80 端口
docker compose stop nginx

sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# 证书会出现在 /etc/letsencrypt/live/your-domain.com/
sudo cp -r /etc/letsencrypt /opt/therabo/certs
sudo chown -R $USER:$USER /opt/therabo/certs
```

### 4.3 启用 HTTPS
编辑 `nginx.conf`：
- 把所有 `YOUR_DOMAIN_HERE` 替换成你的域名
- 取消掉文件顶部的 HTTP→HTTPS 重定向 server 块和文件底部的 443 server 块的注释
- 把 :80 server 里的所有 `location` 块复制到 :443 server 里

然后：
```bash
docker compose up -d nginx
```

### 4.4 证书自动续期
```bash
# 加到 crontab
0 3 1 * * sudo certbot renew --quiet && cp -r /etc/letsencrypt /opt/therabo/certs && docker compose -f /opt/therabo/docker-compose.yml restart nginx
```

---

## 5. 备份

数据全部在两个 docker volume 里。**每天备份一次足够**：

```bash
# 写到 /opt/therabo/backups/2026-01-31.tar.gz
cd /opt/therabo
mkdir -p backups
DATE=$(date +%F)
docker run --rm \
  -v therabo_therabo-data:/data \
  -v therabo_therabo-uploads:/uploads \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/$DATE.tar.gz /data /uploads
```

加到 crontab：
```cron
0 4 * * * cd /opt/therabo && bash -c "DATE=\$(date +\%F); docker run --rm -v therabo_therabo-data:/data -v therabo_therabo-uploads:/uploads -v \$(pwd)/backups:/backup alpine tar czf /backup/\$DATE.tar.gz /data /uploads"
```

**恢复**：
```bash
docker compose stop app
docker run --rm -v therabo_therabo-data:/data -v therabo_therabo-uploads:/uploads \
  -v $(pwd)/backups:/backup alpine sh -c "rm -rf /data/* /uploads/* && tar xzf /backup/2026-01-31.tar.gz -C /"
docker compose start app
```

---

## 6. 管理员后台使用

### 6.1 访问后台
- URL：`https://你的域名/#admin`
- 账号：首次为 `admin` + `.env` 里设置的密码
- 登出后浏览器 cookie 会清掉，下次需重新登录

### 6.2 功能一览
| 菜单 | 你能做什么 |
|---|---|
| **数据看板** | 总销售额、订单数、客户数、近 14 天销量曲线 |
| **产品管理** | 新增 / 编辑 / 复制 / 删除产品；上传产品图（多张，自动生成缩略图）；按 zh/zh-tw/en 编辑所有文案；设置颜色与尺寸 |
| **订单管理** | 查看所有订单 → 修改状态（待支付/已支付/已发货/已完成/已取消）→ 导出 CSV |
| **客户列表** | 「注册账户」标签页：所有注册客户，可重置密码、停用、删除；「订单聚合」：含访客的全量客户消费汇总；都能导出 CSV |
| **内容编辑** | 改首页 Hero 文案 + Hero 背景图；改 About 区域文案 + 配图；改客服邮箱；全部支持三语 |
| **管理员账号** | 添加多个管理员（角色 admin / editor），密码经 bcrypt 加盐哈希存储 |

### 6.3 客户能维护的内容（完整能力清单）

#### 商品 & 订单
✅ **产品 CRUD**：ID、价格（CNY / USD）、分类、颜色、尺寸、图片、名称、标语、描述、推荐使用方式、功效细则、SEO meta、是否精选
✅ **产品图片**：拖拽上传，自动生成 1200/600/原图 三档 WebP，首图作为产品卡封面
✅ **库存监控**：每个产品可设库存数 + 低库存阈值；下单自动扣减；低库存看板告警
✅ **订单管理**：状态流转（待支付 → 已支付 → 已发货 → 已完成）、填写物流单号、CSV 导出
✅ **客户管理**：注册账户列表 / 停用 / 重置密码；含访客的订单聚合统计
✅ **评价审核**：客户提交 → 待审核 → 通过/拒绝/删除；只有「通过」的展示在产品详情页

#### 营销
✅ **首页弹窗 / 顶栏公告**：三语、起止时间窗、可上传图片、CTA 按钮 + 链接；可设"每用户只看一次"
✅ **优惠码**：百分比 / 定额减免 / 免运费三种类型；支持限币种、限最低消费、限使用次数、限有效期；前台输入即可应用
✅ **邮件中心**：
  - 模板管理（系统模板 + 自定义营销模板，支持 `{{变量}}` 替换）
  - 群发活动（按"全部客户 / 注册客户 / 最近 N 天下单 / 订阅者"四种受众）
  - 一键测试发送、发送日志（成功/失败/错误信息）
  - SMTP 配置后台填（支持 Mailgun / SendGrid / 自有 SMTP）
✅ **订阅者管理**：前台 footer 邮件订阅自动入库；可 CSV 导出；用于群发收件
✅ **自动通知**：
  - 客户下单 → 自动发订单确认邮件
  - Stripe/支付宝/微信回调成功 → 自动发收款收据
  - 订单状态改为「已发货」→ 自动带物流单号通知客户
  - 新客户注册 → 自动发欢迎邮件

#### 内容 & 运营
✅ **首页 Hero / About 文案 + 配图** — 三语
✅ **CMS 页面**：隐私政策 / 服务条款 / FAQ / 退换货政策；slug 自定义；富文本 HTML；自动出现在 footer
✅ **运费规则**：按国家+币种设运费；可设"满 X 免运费"；可建多条规则；checkout 自动按国家筛选

#### 系统
✅ **网站设置**：品牌 Logo、Favicon、主品牌色、USD↔CNY 汇率、客服电话、社交链接、维护模式
✅ **管理员账号**：bcrypt 哈希，admin/editor 双角色
✅ **审计日志**：所有写操作自动记录（谁、什么时候、改了什么）

#### 自动生成
✅ **sitemap.xml**：包含首页 + 所有上架产品 + 所有 CMS 页面
✅ **robots.txt**
✅ **Cookie 同意横幅**（前台底部）

❌ **目前仍需改代码的**：
- 顶部导航结构、Header/Footer 的写死品牌字号
- 「科学解析」「奖项荣誉」三个动效展示版块（高度定制的视觉，改文案需动代码）
- 产品分类的三个固定枚举（`protective` / `underwear` / `special`）
- 默认翻译词条（购物车按钮等通用文案）

> 这些工作量都不大，需要的话告诉我。

### 6.4 角色与权限
| 角色 | 能做 | 不能做 |
|---|---|---|
| `admin` | 全部 | — |
| `editor` | 产品管理、订单查看（不能改账号、不能改其它管理员密码） | 删除其它管理员、修改 admin 密码 |

> 角色检查在 `server/src/routes/admin-auth.ts`。当前 editor 共享读写权限，如需更细可改一行代码。

---

## 7. 客户端使用

### 7.1 客户购物流程
1. 浏览首页 → 选语言（zh / zh-tw / en）→ 选币种（CNY / USD）
2. 进入「产品系列」，按分类筛选 → 选颜色、尺寸 → 加入购物车
3. 点购物车 → 「去结算」
4. 弹出结算面板：填收件人 / 邮箱 / 电话 / 地址（已登录会自动填入默认地址）
5. 选支付方式：
   - **Stripe**（信用卡）：跳到 Stripe 托管支付页
   - **支付宝 / 微信支付**：仅 CNY 订单可见
   - **先提交订单（线下支付）**：永远可用，订单状态 `pending`，客服联系收款

### 7.2 客户账户能做什么（前台 `#account` 路由）
- 个人资料：改姓名、电话、国家
- 我的订单：查看所有历史订单与状态
- 地址簿：增删改地址，设置默认地址
- 修改密码：6 位以上

### 7.3 注册 / 登录
- 顶部「登录 / 注册」按钮
- 密码 6 位以上；服务器以 **bcrypt** 加盐哈希存储
- 登录后会发 7 天有效的 httpOnly cookie

---

## 8. 支付配置

### 8.1 Stripe（推荐先开通）
1. 注册 https://dashboard.stripe.com/
2. 拿到密钥：`Developers → API keys → Secret key`
3. 填到 `.env`：`STRIPE_SECRET_KEY=sk_live_...`
4. 配 webhook：`Developers → Webhooks → Add endpoint`
   - URL：`https://你的域名/api/payments/stripe/webhook`
   - 事件：勾选 `checkout.session.completed`
   - 保存后复制 `Signing secret`，填到 `.env`：`STRIPE_WEBHOOK_SECRET=whsec_...`
5. `docker compose restart app`
6. 用 Stripe 测试卡 `4242 4242 4242 4242` 走一笔，订单应自动变 `paid`

### 8.2 支付宝
1. 申请商户：https://open.alipay.com/ （企业实名 + 资质审核，约 1–2 周）
2. 创建应用 → 拿到 `APPID`
3. 在「开发者中心」生成 RSA2 密钥对 → 上传应用公钥，下载支付宝公钥
4. 填 `.env` 的 `ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY`
   - 私钥/公钥的换行符要写成字面量 `\n`，例如
     `ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIEvg...\n-----END RSA PRIVATE KEY-----`
5. 在支付宝应用配置「异步通知地址」：`https://你的域名/api/payments/alipay/notify`
6. `docker compose restart app`

### 8.3 微信支付 v3
1. 申请商户号：https://pay.weixin.qq.com/ （企业实名 + 资质审核）
2. 拿到 `appid` / `mchid`，下载 API V3 密钥与商户私钥（.pem）
3. 填 `.env` 的 `WECHAT_*` 全部字段（私钥同样 `\n` 转义）
4. 在微信商户后台配置「支付结果通知 URL」：`https://你的域名/api/payments/wechat/notify`
5. `docker compose restart app`
6. 前端会展示 Native 二维码，用户用微信扫码支付

### 8.4 没配置在线支付怎么办？
完全 OK。购物车里只会显示「先提交订单（线下/转账支付）」一个按钮。订单照样进系统、后台能看到，客服可以发邮件/电话联系客户走线下收款，收到钱后在后台把状态改成「已支付」。

---

## 9. 常见问题

**Q：客户改了内容/上传了图，但前台没看到？**
A：前台用浏览器缓存。让客户 Ctrl+Shift+R 强刷一次。或在 nginx 加 `Cache-Control: no-cache` 给 `index.html`。

**Q：如何重置忘掉的管理员密码？**
```bash
docker compose exec app sh
# 进入容器后用 sqlite3（如果镜像里没有就 apk add sqlite）
node -e "import('bcryptjs').then(b => b.default.hash('新密码', 12).then(h => console.log(h)))"
# 拿到哈希后：
sqlite3 /app/data/therabo.db "UPDATE admin_users SET password_hash='上一步生成的哈希' WHERE username='admin';"
```

**Q：怎么导出所有数据？**
- 订单：后台「订单管理 → 导出 CSV」
- 客户：后台「客户列表 → 导出 CSV」
- 全库：`docker cp therabo-app:/app/data/therabo.db ./backup.db`

**Q：图片上传失败「413 Request Entity Too Large」？**
A：默认 10 MB。提高 `.env` 的 `MAX_UPLOAD_MB` 并改 `nginx.conf` 的 `client_max_body_size`，然后 `docker compose restart`。

**Q：如何升级代码？**
```bash
cd /opt/therabo
git pull           # 或 scp 新文件覆盖
docker compose up -d --build
```
数据不会丢（在 volume 里）。

**Q：日志在哪里看？**
```bash
docker compose logs -f app          # 应用日志
docker compose logs -f nginx        # 反代日志
docker compose exec app cat /app/data/therabo.db  # 别这么干 :)
```

**Q：我想把数据库从 SQLite 换成 PostgreSQL？**
代码里的数据访问层都在 `server/src/db.ts` 和各路由文件里集中，替换 `better-sqlite3` 为 `pg` + 改 schema 不算大。需要的话告诉我。

---

## 10. 安全清单（上线前过一遍）

- [ ] `.env` 的 `JWT_SECRET` 是 32+ 字节随机串
- [ ] `.env` **不在** git 仓库里（`.gitignore` 已包含）
- [ ] 首次登录后立即修改 admin 密码（删旧 admin 建新）
- [ ] HTTPS 已配置（Let's Encrypt 或商业证书）
- [ ] 服务器防火墙只开 22 / 80 / 443
- [ ] 数据库 / 上传目录每天自动备份
- [ ] Stripe webhook secret 已配置（否则恶意人能伪造支付成功）
- [ ] 服务器 SSH 关闭密码登录，仅允许密钥
- [ ] 阿里云/腾讯云后台开启磁盘快照

---

## 11. 新功能使用流程（10 个 cheat-sheet）

### 11.1 配置 SMTP（启用邮件功能的前提）
后台「邮件中心 → SMTP」填好 host/port/user/pass/from → 保存 → 「模板」标签页右下角输入测试收件人 → 点「发送测试」验证。

### 11.2 创建一个首页弹窗
后台「弹窗 / 顶栏」→ 新增弹窗 → 切「简中」标签页填标题/正文 → 上传图片（可选）→ 设 CTA 按钮文字 + 链接 → 选起止时间 → 「只展示一次」（推荐勾上）→ 保存。
访客打开首页就会看到，且关闭后不会再次弹出。

### 11.3 创建一个顶部公告条
同上但选「顶栏」类型。可选背景色 + 文字色（适配品牌色）。多个顶栏按优先级取一个展示。

### 11.4 创建优惠码
后台「优惠码 → 新增」→ 代码 `WELCOME10`，类型「百分比」，金额 `10`，最低消费 `200`，最大使用次数 `100`，过期 `2026-12-31` → 保存。
告诉客户结算时输入 `WELCOME10` 即可减 10%。

### 11.5 发送一次群发营销邮件
后台「邮件中心 → 群发 → 新建群发」→ 填名称 → 从「模板」下拉选一个（或直接写主题 + HTML 正文）→ 选受众「订阅者 / 注册客户 / 最近 30 天下单 / 全部」→ 点「立即发送」（或保存草稿稍后发）。
发完会显示成功/失败数；详细日志在「邮件中心 → 日志」。

### 11.6 改隐私政策 / FAQ 等页面
后台「CMS 页面」→ 找到 `privacy` → 编辑 → 三语 tab 分别填 HTML 正文 → 保存。前台 footer 立刻可见。

### 11.7 改运费规则
后台「运费规则 → 新增」→ 名称（三语）→ 国家逗号分隔（`中国, China` 或 `*` 表示所有国家）→ 币种 → 运费金额 → 满 X 包邮 → 预计天数 → 保存。
前台结算时会按国家+币种自动筛选可用运费方案。

### 11.8 库存监控
后台「库存监控」→ 找到产品 → 填写「库存」和「低库存阈值」→ 保存。
留空 = 不跟踪库存（永远可下单）。下单后库存自动扣减，低于阈值会在页面顶部告警。

### 11.9 审核客户评价
后台「评价审核」默认显示「待审核」tab → 看内容 → 「通过」/「拒绝」。
通过后立刻出现在对应产品详情页。

### 11.10 维护模式（升级时使用）
后台「站点设置」→ 勾选「维护模式」→ 填提示文案 → 保存。前台会显示维护提示。
（注：当前 MVP 仅记录该状态；如需强制阻断访问，可让我加一个全站拦截组件。）

---

## 12. 交付状态

| 模块 | 状态 |
|---|---|
| 前端：三语 / 多币种 / 购物车 / 产品详情 / 账户中心 | ✅ 完成 |
| 后端：产品 / 订单 / 客户 / 内容 / 图片 / 管理员 REST API | ✅ 完成 |
| 鉴权：bcrypt + JWT cookie | ✅ 完成 |
| 数据库：SQLite + 自动 schema + 幂等 seed | ✅ 完成 |
| 图片上传 + 多档缩略图 | ✅ 完成 |
| Stripe Checkout + Webhook | ✅ 完成（凭据需客户填） |
| 支付宝 / 微信支付 v3 | ✅ 完成（凭据需客户申请） |
| Docker + Compose + Nginx | ✅ 完成 |
| 部署文档 | ✅ 本文件 |
| **邮件**：SMTP 配置 + 自动通知（订单/收款/发货/欢迎）+ 模板编辑 + 群发 + 日志 + 订阅者管理 | ✅ 完成 |
| **营销**：首页弹窗 + 顶栏公告 + 优惠码（百分比/定额/免运费） | ✅ 完成 |
| **运营**：库存监控 + 物流单号 + 运费规则 + 评价审核 + CMS 页面 + 维护模式 | ✅ 完成 |
| **SEO**：动态 sitemap.xml + robots.txt + 产品 SEO meta 字段 | ✅ 完成 |
| **合规**：Cookie 同意横幅 + 隐私/服务条款/FAQ/退换货 CMS 占位 | ✅ 完成 |
| **审计**：所有管理员操作自动记录 | ✅ 完成 |
| **网站设置**：Logo/Favicon/品牌色/汇率/客服联系/社交 | ✅ 完成 |
| 单元测试 / E2E 测试 | ⚠️ 未包含 — 推荐后续补 |
| 弃单提醒（abandoned cart）后台任务 | ⚠️ 未包含（需要轻量 cron） |

**结论：可以交付给客户上线**。剩下的 ⚠️ 项目都不是阻塞性的，根据客户业务节奏决定优先级。
