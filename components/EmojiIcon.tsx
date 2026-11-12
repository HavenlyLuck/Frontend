// 기기마다 모양이 다른 기본 이모지 대신 쓰는 천운 아이콘 (public/icons/emoji/*.png)
// 글자 크기(1em)를 따라가서, 이모지가 있던 자리에 그대로 넣으면 같은 크기로 보인다
export type EmojiIconName =
  | 'rice'               // 🌾 쌀포인트
  | 'ssal-ticket'        // 🎫 쌀 응모권
  | 'raffle-placeholder' // 🎟 응모 상품 사진이 없을 때
  | 'box'                // 📦 상품 사진이 없을 때
  | 'timer'              // ⏱ 남은 시간
  | 'trophy'             // 🎉 당첨
  | 'store'              // 💳 일반 상점
  | 'crown'              // 👑 아바타 대회
  | 'contents'           // ✨ 컨텐츠
  | 'pending'            // 🙏 답변 대기

export default function EmojiIcon({ name, label }: { name: EmojiIconName; label?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/emoji/${name}.png`}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className="emoji-icon"
      width={128}
      height={128}
      draggable={false}
    />
  )
}
