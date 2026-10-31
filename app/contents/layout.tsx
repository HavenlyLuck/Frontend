import { CONTENTS_OPEN } from "@/lib/features";

// /contents 아래 모든 페이지 공통 — 스위치가 꺼져 있으면 실제 화면 대신 "준비 중" 안내만 보여준다
export default function ContentsLayout({ children }: { children: React.ReactNode }) {
  if (CONTENTS_OPEN) return <>{children}</>;

  return (
    <div className="home-container" style={{ maxWidth: 960 }}>
      <div className="coming-soon-box large" style={{ marginTop: 32 }}>
        <div className="emoji">✨</div>
        <div className="title">컨텐츠는 준비 중이에요</div>
        <div className="desc">
          내 캐릭터로 즐기는 아바타 자랑 대회 등 다양한 컨텐츠를 준비하고 있어요.
          <br />
          그동안 마이페이지에서 캐릭터를 미리 꾸며 두세요!
        </div>
      </div>
    </div>
  );
}
