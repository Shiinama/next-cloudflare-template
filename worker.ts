// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from './.open-next/worker.js'

export default {
  fetch: handler.fetch
  // async scheduled(controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
  //   // 你可以在这里根据 cron 表达式执行不同的任务
  //   switch (controller.cron) {
  //     case '*/3 * * * *':
  //       // 每三分钟执行一次
  //       // eslint-disable-next-line no-console
  //       console.log('cron processed for:', controller.scheduledTime)
  //       break
  //     case '*/10 * * * *':
  //       // 每十分钟执行一次
  //       // eslint-disable-next-line no-console
  //       console.log('cron processed for:', controller.scheduledTime)
  //       break
  //     case '*/45 * * * *':
  //       // 每四十五分钟执行一次
  //       // eslint-disable-next-line no-console
  //       console.log('cron processed for:', controller.scheduledTime)
  //       break
  //   }
  // }
} satisfies ExportedHandler<CloudflareEnv>

// // @ts-ignore `.open-next/worker.ts` is generated at build time
// export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
// export { Counter } from './durable/counter.js'
