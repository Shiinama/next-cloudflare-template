本次更新主要聚焦于依赖升级，以及开发体验。

1. 带路由进度条的useRouter进行了分离
2. 增加reactCompiler
3. 为了适配Win的本地数据库调试，去掉better-sqlite3换成了纯js写得@libsql/client
4.

_最后更新：2025年1月_

pnpm wrangler d1 create next-cloudflare-template-db
pnpm wrangler r2 bucket create next_cloudflare_template_cache
pnpm wrangler r2 bucket create next-cloudflare-template-static
