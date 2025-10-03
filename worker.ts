// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from './.open-next/worker.js'

export default {
  fetch: handler.fetch
} satisfies ExportedHandler<CloudflareEnv>

// // @ts-ignore `.open-next/worker.ts` is generated at build time
// export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
// export { Counter } from './durable/counter.js'
