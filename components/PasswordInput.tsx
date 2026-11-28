'use client'

import { useState, type InputHTMLAttributes } from 'react'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'

// 비밀번호 입력칸 — 오른쪽 눈 버튼을 누르면 입력한 비밀번호를 글자로 보여 준다 (다시 누르면 가린다)
export default function PasswordInput({ style, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-input">
      <input {...props} type={visible ? 'text' : 'password'} style={{ ...style, paddingRight: 44 }} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
        aria-pressed={visible}
        title={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
      >
        {visible ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  )
}
