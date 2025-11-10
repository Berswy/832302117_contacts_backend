#!/usr/bin/env bash
set -euo pipefail

# ==== 基本信息 ====
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE_NAME="contacts_backend"
PY_BIN="${PY_BIN:-python3}"
VENV_DIR="${PROJECT_DIR}/.venv"
GUNICORN_BIND="127.0.0.1:5000"

echo "[1/5] 检查并按需安装后端基础依赖..."
MISSING_PKGS=()
for pkg in "${PY_BIN}" "${PY_BIN}-venv" python3-pip curl; do
	if ! dpkg -s "$pkg" >/dev/null 2>&1; then
		MISSING_PKGS+=("$pkg")
	fi
done
if [ "${#MISSING_PKGS[@]}" -gt 0 ]; then
	echo "将安装缺失包: ${MISSING_PKGS[*]}"
	sudo apt-get update -y
	sudo apt-get install -y "${MISSING_PKGS[@]}"
else
	echo "依赖已满足，跳过 apt 安装"
fi

echo "[2/5] 创建并激活虚拟环境..."
if [ ! -d "${VENV_DIR}" ]; then
	${PY_BIN} -m venv "${VENV_DIR}"
fi
# shellcheck disable=SC1090
source "${VENV_DIR}/bin/activate"
pip install --upgrade pip

echo "[3/5] 安装后端依赖和 gunicorn..."
pip install -r "${PROJECT_DIR}/requirements.txt"
pip install gunicorn

echo "[4/5] 创建 systemd 服务 ${SERVICE_NAME}.service ..."
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
sudo bash -s <<EOF
cat > "${SERVICE_FILE}" <<SERVICE
[Unit]
Description=Contacts Backend (Flask via gunicorn)
After=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${PROJECT_DIR}
Environment=FLASK_ENV=production
ExecStart=${VENV_DIR}/bin/gunicorn -w 2 -b ${GUNICORN_BIND} app:app
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SERVICE
EOF

echo "[5/5] 启动并设置开机自启..."
sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"
sudo systemctl --no-pager --full status "${SERVICE_NAME}" || true

echo
echo "后端已部署完成："
echo "- systemd 服务：${SERVICE_NAME}"
echo "- 监听地址：${GUNICORN_BIND}（仅本机回环，供 Nginx 反向代理使用）"
echo "- 下一步：运行前端的 deploy_ubuntu.sh 完成 Nginx 配置与公网访问"


