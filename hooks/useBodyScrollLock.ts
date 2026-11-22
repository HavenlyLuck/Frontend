'use client'

import { useEffect } from 'react'

// 팝업이 떠 있는 동안 뒤 화면이 마우스 휠·터치로 스크롤되지 않게 막는다.
// 스크롤바가 사라지면서 화면이 옆으로 밀리지 않도록 그 너비만큼 오른쪽 여백을 채운다
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const html = document.documentElement
    const body = document.body
    const scrollbar = window.innerWidth - html.clientWidth
    const prev = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow, paddingRight: body.style.paddingRight }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.paddingRight = prev.paddingRight
    }
  }, [locked])
}
