import { getCloudflareContext } from '@opennextjs/cloudflare'

export const getCounterDO = () => {
  const cf = getCloudflareContext()
  // 我们使用一个固定的名称 "singleton" 来确保我们总是与同一个 DO 实例交互。
  // 您也可以根据用户ID、文档ID等动态生成名称。
  const id = cf.env.COUNTER_DO.idFromName('singleton')
  return cf.env.COUNTER_DO.get(id)
}
