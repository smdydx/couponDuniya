#!/usr/bin/env bash
set -euo pipefail
DOMAIN=${DOMAIN:-example.com}
EMAIL=${EMAIL:-admin@${DOMAIN}}
WEBROOT=${WEBROOT:-/var/www/html}
if ! command -v certbot >/dev/null 2>&1; then
  echo "Install certbot first (apt-get install -y certbot)" >&2
  exit 1
fi
mkdir -p "$WEBROOT"
certbot certonly --webroot -w "$WEBROOT" -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --rsa-key-size 4096 --quiet || {
  echo "Certbot failed" >&2; exit 1; }
echo "Certificates stored under /etc/letsencrypt/live/$DOMAIN"
echo "Cron example: 0 3 * * * certbot renew --quiet && docker compose exec nginx nginx -s reload"
