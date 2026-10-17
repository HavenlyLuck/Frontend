import { drawKuji, getKujiBoard, type KujiBoardResponse } from './api'
import type { KujiLastOne } from './kujiData'
import { drawTestKuji, getTestKujiBoard, isTestKuji } from './kujiTest'

/*
 * 쿠지 제비판 — 서버 API(GET /kuji/{id}/board, POST /kuji/{id}/draw)를 화면에서 쓰기 좋게 감싼다.
 *
 * 동시성 방식(확정할 때만 확인): 제비를 고르는 건 화면에서만 하고, "선택 완료" 때 서버가 한 번에 확정한다.
 *   서버는 판을 잠그고, 고른 제비 중 하나라도 이미 나갔으면 아무것도 뽑지 않고 그 번호들을 돌려준다(부분 뽑기 없음).
 *   포인트 차감·보관함 적재·라스트원상도 같은 트랜잭션에서 서버가 처리한다.
 *   제비판 조회는 판별 version을 두고, since=version이 최신이면 서버가 빈 응답(null)을 줘서 트래픽을 줄인다.
 *   아직 안 뽑힌 제비의 등급은 서버가 절대 내려주지 않는다(뽑힌 제비만 등급 공개).
 */

export interface KujiBoard {
  version: number
  drawn: { id: number; grade: string }[]
}

export type KujiDrawResponse =
  // lastOne: 이번 뽑기로 판의 마지막 제비가 나갔으면 라스트원상
  | { ok: true; drawn: { ticketId: number; grade: string }[]; lastOne: KujiLastOne | null; board: KujiBoard }
  | { ok: false; conflictIds: number[]; board: KujiBoard }

function toBoard(b: KujiBoardResponse): KujiBoard {
  return { version: b.version, drawn: b.drawn.map(d => ({ id: d.ticket_number, grade: d.grade })) }
}

// since가 지금 버전과 같으면 바뀐 게 없으니 null
export async function fetchKujiBoard(kujiId: number, since?: number): Promise<KujiBoard | null> {
  const board = isTestKuji(kujiId) ? await getTestKujiBoard(since) : await getKujiBoard(kujiId, since)
  return board ? toBoard(board) : null
}

// 포인트 부족·매진 같은 실패는 ApiError로 던진다
export async function confirmKujiDraw(token: string, kujiId: number, ticketIds: number[]): Promise<KujiDrawResponse> {
  const res = isTestKuji(kujiId) ? await drawTestKuji(ticketIds) : await drawKuji(token, kujiId, ticketIds)
  const board = toBoard(res.board)
  if (!res.ok) return { ok: false, conflictIds: res.conflict_ticket_numbers, board }
  return {
    ok: true,
    drawn: res.drawn.map(d => ({ ticketId: d.ticket_number, grade: d.grade })),
    lastOne: res.last_one ? { title: res.last_one.name, image: res.last_one.image_url ?? '' } : null,
    board,
  }
}
