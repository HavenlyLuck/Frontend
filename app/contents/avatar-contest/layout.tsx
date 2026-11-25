import { AVATAR_CONTEST_OPEN } from "@/lib/features";
import EmojiIcon from '@/components/EmojiIcon'

// 아바타 자랑 대회 — 스위치가 꺼져 있으면 실제 화면 대신 "준비 중" 안내만 보여준다
export default function AvatarContestLayout({ children }: { children: React.ReactNode }) {
  if (AVATAR_CONTEST_OPEN) return <>{children}</>;

  return (
    <div className="home-container" style={{ maxWidth: 960 }}>
      <div className="coming-soon-box large" style={{ marginTop: 32 }}>
        <div className="emoji"><EmojiIcon name="contents" /></div>
        <div className="title">아바타 자랑 대회는 준비 중이에요</div>
        <div className="desc">
          내 캐릭터를 뽐내고 투표받는 대회를 준비하고 있어요.
          <br />
          그동안 아바타 아이디어 공모전에 참여해 보세요!
        </div>
      </div>
    </div>
  );
}
