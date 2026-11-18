import Link from 'next/link'
import LogoMark from '@/components/LogoMark'

export const metadata = { title: '페이지를 찾을 수 없어요' }

// 없는 주소로 들어왔을 때 (기본 영어 404 화면 대신)
export default function NotFound() {
  return (
    <main className="home-container not-found">
      <LogoMark className="not-found-mark" />
      <h1>페이지를 찾을 수 없어요</h1>
      <p>주소가 바뀌었거나 없어진 페이지예요. 진행 중인 응모를 둘러보세요.</p>
      <div className="not-found-actions">
        <Link className="hero-cta" href="/">홈으로</Link>
        <Link className="home-hero-more" href="/eungmo">응모 보러 가기 →</Link>
      </div>
    </main>
  )
}
