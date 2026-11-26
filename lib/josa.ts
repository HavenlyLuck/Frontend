// 이름 뒤에 붙는 조사(을/를, 은/는, 이/가, 과/와)를 받침에 맞춰 고른다 — "갈색 캡모자을(를)" 대신 "갈색 캡모자를"
// 끝 글자가 한글이면 받침으로, 숫자면 읽는 소리(일·이·삼…)로 정한다. 그 밖(영문 등)은 "을(를)"처럼 둘 다 적는다

type Pair = '을/를' | '은/는' | '이/가' | '과/와'

// 0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 — 받침 있음 / 2 이, 4 사, 5 오, 9 구 — 없음
const DIGIT_BATCHIM: Record<string, boolean> = {
  '0': true, '1': true, '2': false, '3': true, '4': false, '5': false, '6': true, '7': true, '8': true, '9': false,
}

function hasBatchim(word: string): boolean | null {
  const last = word.trim().replace(/[)\]}"'”’»」』\s]+$/, '').slice(-1)
  if (!last) return null
  const code = last.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0
  if (last in DIGIT_BATCHIM) return DIGIT_BATCHIM[last]
  return null
}

// josa('갈색 캡모자', '을/를') → '를'
export function josa(word: string, pair: Pair): string {
  const [withBatchim, without] = pair.split('/')
  const b = hasBatchim(word)
  if (b === null) return `${withBatchim}(${without})`
  return b ? withBatchim : without
}

// withJosa('갈색 캡모자', '을/를') → '갈색 캡모자를'
export function withJosa(word: string, pair: Pair): string {
  return word + josa(word, pair)
}
