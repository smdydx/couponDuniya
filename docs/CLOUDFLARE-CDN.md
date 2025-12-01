# Cloudflare CDN Integration

1. Add site to Cloudflare and update DNS
   - Point `couponcommerce.com` and `www` CNAME/A records to your origin (or load balancer).
   - Enable proxy (orange cloud) for CDN + WAF.

2. Origin configuration
   - Keep Nginx listening on 80/443 with valid certificates (Let’s Encrypt).
   - Set `proxy_set_header CF-Connecting-IP` in Nginx if you need real client IPs (Cloudflare already sends `CF-Connecting-IP` / `True-Client-IP`).

3. Caching rules
   - Cache static assets aggressively: `/_next/static/*`, `/images/*`.
   - Bypass cache for `/api/*`, `/admin/*`, `/go/*` (redirector), and auth endpoints.
   - Edge TTL: 30–60 min for static; 1 year for hashed assets.

4. Security
   - Enable WAF managed rules.
   - Turn on Bot Fight Mode (optional).
   - Restrict admin (optional) via Cloudflare Access or IP allowlist.
   - Always Use HTTPS + HSTS.

5. Performance settings
   - HTTP/3, 0-RTT enabled.
   - Brotli compression on.
   - Polish/Images: leave OFF initially if you rely on Next Image for optimization.

6. Page rules (examples)
   - `*couponcommerce.com/_next/static/*` → Cache Level: Cache Everything, Edge Cache TTL 1 year.
   - `*couponcommerce.com/api/*` → Cache Level: Bypass.
   - `*couponcommerce.com/go/*` → Cache Level: Bypass; Disable Security if redirects are being blocked.

7. Origin health & monitoring
   - Set up origin health checks if using a load balancer.
   - Monitor firewall events and WAF blocks to tune false positives.
