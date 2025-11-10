# 通讯录管理系统 · 后端（Flask + SQLite）

本仓库为通讯录系统的后端服务，提供联系人增删改查 API，默认通过 Nginx 反向代理供前端访问。

## 一、设计与实施过程
- **架构选择**：采用前后端分离。后端使用 Flask + SQLAlchemy + SQLite，前端静态部署于 Nginx，通过 `/api` 反代后端，隔离静态资源与 API。
- **数据模型**：定义 `Contact(id, name, phone)`，以 SQLite 持久化，使用 SQLAlchemy 简化 ORM 映射与迁移前的原型实现。
- **接口设计**：RESTful 风格，统一返回 JSON，错误使用合适的 HTTP 状态码（如 404）。
- **跨域策略**：开发与直连时启用 `Flask-CORS`；生产通过 Nginx 反向代理，不暴露后端公网端口。
- **部署方式**：后端以 `gunicorn` + `systemd` 常驻，监听 `127.0.0.1:5000`，仅供同机 Nginx 访问，提升安全性与稳定性。

## 二、功能结构图
```
客户端（浏览器）
        │
        ▼
     Nginx（80）
   ┌────────────┐
   │  / 静态页   │───> 前端目录（index.html, script.js, style.css）
   │  /api/*    │───> 反代 http://127.0.0.1:5000
   └────────────┘
        │
        ▼
Flask(app.py) ── SQLAlchemy ── SQLite(database.db)
          └─ REST API: GET/POST/PUT/DELETE /api/contacts
```

## 三、接口说明
- `GET /api/contacts`：获取联系人列表
- `POST /api/contacts`：创建联系人（JSON: `{name, phone}`）
- `PUT /api/contacts/<id>`：更新联系人
- `DELETE /api/contacts/<id>`：删除联系人

## 四、快速开始（本地）
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
# 访问: http://127.0.0.1:5000/ 与 /api/contacts
```

## 五、生产部署（Ubuntu 一键脚本）
已提供脚本：`deploy_ubuntu.sh`

脚本要点：
- 安装 `python3`、`python3-venv`、`pip`、`gunicorn`
- 创建虚拟环境并安装依赖
- 生成 `systemd` 服务 `contacts_backend`，以 `gunicorn -b 127.0.0.1:5000 app:app` 运行

使用步骤：
```bash
cd 832302117_contacts_backend
bash deploy_ubuntu.sh

# 服务运维
sudo systemctl status contacts_backend
sudo systemctl restart contacts_backend
sudo journalctl -u contacts_backend -n 200 --no-pager
```

## 六、目录结构
```
832302117_contacts_backend/
├─ app.py            # Flask 入口，REST API
├─ models.py         # SQLAlchemy 模型与 db 初始化
├─ config.py         # 可扩展的配置（当前使用 app.py 的内联配置）
├─ requirements.txt  # 后端依赖
├─ deploy_ubuntu.sh  # 一键部署脚本（gunicorn+systemd）
└─ .gitignore        # 忽略虚拟环境、数据库、日志等
```

## 七、运维与安全建议
- 保持后端绑定 `127.0.0.1`，只由 Nginx 访问
- 通过 Nginx/防火墙限制来源，必要时为 `/api` 增加限流与访问日志
- 备份 `database.db`（位于后端工作目录）