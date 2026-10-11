import { getKujiProduct, type KujiLastOne } from './kujiData'

/*
 * 쿠지 제비판 — 서버 API 자리. 쿠지 백엔드가 아직 없어서 지금은 이 파일이 서버 역할을 흉내 낸다.
 *
 * 동시성 방식(B, 확정할 때만 확인): 제비를 고르는 건 화면에서만 하고, "선택 완료" 때 서버가 한 번에 확정한다.
 *   서버: UPDATE kuji_tickets SET status='drawn', user_id=:me WHERE id IN (:ids) AND status='available'
 *         → 바뀐 줄 수 ≠ 고른 장수면 롤백하고 이미 뽑힌 id를 돌려준다(부분 뽑기 없음).
 *         → 포인트 차감·보관함 적재도 같은 트랜잭션에서.
 *   제비판 조회는 판별 version을 두고, since=version이 최신이면 빈 응답(null)으로 트래픽을 줄인다.
 *
 * TODO(backend): GET /kuji/{id}/board?since=<version>, POST /kuji/{id}/draw 로 교체
 *   - 아직 안 뽑힌 제비의 등급은 절대 내려주지 않는다(뽑힌 제비만 등급 공개)
 *   - 지금 흉내는 이 브라우저 안에서만 상태를 가지므로, 다른 사람의 뽑기는 서버가 생겨야 실제로 보인다
 */

export interface KujiBoard {
  version: number
  drawn: { id: number; grade: string }[]
}

export type KujiDrawResponse =
  // lastOne: 이번 뽑기로 판의 마지막 제비가 나갔으면 라스트원상 (서버가 같은 트랜잭션에서 판단·보관함 적재)
  | { ok: true; drawn: { ticketId: number; grade: string }[]; lastOne: KujiLastOne | null; board: KujiBoard }
  | { ok: false; conflictIds: number[]; board: KujiBoard }

// ── 여기부터 서버 흉내 ──

const versions = new Map<string, number>()

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const latency = () => delay(150 + Math.random() * 250)

function snapshot(productId: string): KujiBoard {
  const product = getKujiProduct(productId)
  return {
    version: versions.get(productId) ?? 1,
    drawn: product ? product.tickets.filter(t => t.status === 'drawn').map(t => ({ id: t.id, grade: t.grade })) : [],
  }
}

function bump(productId: string) {
  versions.set(productId, (versions.get(productId) ?? 1) + 1)
}

// ── 화면이 부르는 API ──

// since가 지금 버전과 같으면 바뀐 게 없으니 null
export async function fetchKujiBoard(productId: string, since?: number): Promise<KujiBoard | null> {
  await latency()
  const board = snapshot(productId)
  return since != null && since === board.version ? null : board
}

export async function confirmKujiDraw(productId: string, ticketIds: number[]): Promise<KujiDrawResponse> {
  await latency()
  const product = getKujiProduct(productId)
  if (!product) return { ok: false, conflictIds: ticketIds, board: snapshot(productId) }

  // 서버의 조건부 UPDATE와 같은 판단 — 하나라도 이미 나갔으면 아무것도 뽑지 않는다
  const conflictIds = ticketIds.filter(id => product.tickets.find(t => t.id === id)?.status !== 'available')
  if (conflictIds.length > 0) return { ok: false, conflictIds, board: snapshot(productId) }

  const drawn = ticketIds.map(id => {
    const ticket = product.tickets.find(t => t.id === id)!
    ticket.status = 'drawn'
    return { ticketId: id, grade: ticket.grade }
  })
  bump(productId)
  // 판을 비운 사람이 라스트원상까지 받는다 — 화면이 아니라 서버가 정한다
  const emptied = product.tickets.every(t => t.status === 'drawn')
  return { ok: true, drawn, lastOne: emptied ? product.lastOne ?? null : null, board: snapshot(productId) }
}
