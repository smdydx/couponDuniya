#!/usr/bin/env bash
# Obtain/renew Let's Encrypt certificates using webroot validation.
# Usage: DOMAIN=couponcommerce.com EMAIL=admin@couponcommerce.com ./deployment/issue_ssl.sh
set -euo pipefail

DOMAIN=${DOMAIN:-example.com}
EMAIL=${EMAIL:-admin@${DOMAIN}}
WEBROOT=${WEBROOT:-/var/www/html}

if ! command -v certbot >/dev/null 2>&1; then
  echo "Install certbot first (e.g., apt-get install -y certbot)" >&2
  exit 1
fi

mkdir -p "$WEBROOT"

# Initial certificate
certbot certonly --webroot -w "$WEBROOT" -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --rsa-key-size 4096 --quiet || {
  echo "Certbot failed" >&2; exit 1; }

echo "Certificates stored under /etc/letsencrypt/live/$DOMAIN"

echo "Add a cron entry for renewal, e.g.:"
echo "0 3 * * * certbot renew --quiet && docker compose exec nginx nginx -s reload"
