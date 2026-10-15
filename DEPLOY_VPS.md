# 🚀 Deploy do Escritório Virtual Privado na VPS (176.57.188.108)

Execute estes passos conectados via SSH na sua VPS (`root@176.57.188.108`).

---

### Passo 1: Limpar os containers antigos do WorkAdventure
```bash
# 1. Parar e remover os containers antigos que estavam testando ontem
docker compose -f /opt/virtual-office/docker-compose.ip.yml down 2>/dev/null || true
docker rm -f maps-server workadventure-play workadventure-back 2>/dev/null || true

# 2. Criar a pasta do novo escritório
mkdir -p /opt/skyoffice
cd /opt/skyoffice
```

---

### Passo 2: Criar o `docker-compose.yml` de Produção
```bash
cat << 'EOF' > /opt/skyoffice/docker-compose.yml
version: '3.8'

services:
  skyoffice-backend:
    image: node:18-alpine
    container_name: skyoffice-backend
    restart: always
    working_dir: /app
    volumes:
      - ./server:/app
    environment:
      - PORT=2567
    ports:
      - "2567:2567"
    command: sh -c "npm install && npm run build && npm run start"

  skyoffice-frontend:
    image: nginx:alpine
    container_name: skyoffice-frontend
    restart: always
    volumes:
      - ./client/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
    depends_on:
      - skyoffice-backend
EOF
```

---

### Passo 3: Criar a configuração do Nginx (`nginx.conf`)
```bash
cat << 'EOF' > /opt/skyoffice/nginx.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para WebSocket do Colyseus
    location /colyseus/ {
        proxy_pass http://176.57.188.108:2567/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
EOF
```
