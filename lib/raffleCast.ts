import { getRaffleDrawCast, type RaffleCastMember } from './api'
import { getValidSession } from './auth'

// 번개 추첨 화면에 세울 응모자 목록. 매진되면 더는 바뀌지 않으므로,
// 추첨을 기다리는 5분 동안 미리 받아 두고 결과를 열 때 그대로 쓴다.
const cache = new Map<number, Promise<RaffleCastMember[]>>()

export function prefetchDrawCast(raffleProductId: number): Promise<RaffleCastMember[]> {
  const cached = cache.get(raffleProductId)
  if (cached) return cached
  const promise = getValidSession().then(async (session) => {
    if (!session) throw new Error('로그인이 필요합니다')
    const res = await getRaffleDrawCast(session.token, raffleProductId)
    return res.cast
  })
  // 실패하면 다음에 다시 시도할 수 있도록 캐시에서 뺀다
  promise.catch(() => cache.delete(raffleProductId))
  cache.set(raffleProductId, promise)
  return promise
}
