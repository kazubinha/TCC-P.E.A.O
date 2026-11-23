export function IconeMenu({ largura = 44 }) {
  return (
    <svg width={largura} height={largura * 0.82} viewBox="0 0 44 36" aria-hidden="true" focusable="false">
      <g fill="#e6e6ee">
        <rect y="0" width="44" height="9" rx="4.5" />
        <rect y="13.5" width="44" height="9" rx="4.5" />
        <rect y="27" width="44" height="9" rx="4.5" />
      </g>
    </svg>
  )
}

export function IconeUsuario() {
  return (
    <svg width="34" height="42" viewBox="0 0 34 42" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#9a9aab" strokeWidth="3" strokeLinejoin="round">
        <circle cx="17" cy="11" r="8" />
        <path d="M2 38v-3c0-6 5-10 11-10h8c6 0 11 4 11 10v3z" />
      </g>
    </svg>
  )
}

// Avatar provisório do botão de chat.
export function AvatarChat() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="avatar-fundo" cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#fdfdfd" />
          <stop offset="1" stopColor="#fdfdfd" />
        </radialGradient>
      </defs>
      <circle cx="26" cy="26" r="26" fill="url(#avatar-fundo)" />
      <ellipse cx="26" cy="22" rx="9" ry="11" fill="#fdfdfd" opacity=".55" />
      <path d="M8 48c2-9 9-13 18-13s16 4 18 13z" fill="#fdfdfd" opacity=".55" />
    </svg>
  )
}

export function IconeCamera() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#111" strokeWidth="6" strokeLinejoin="round">
        <path d="M8 28h18l6-10h32l6 10h18v52H8z" />
        <circle cx="48" cy="52" r="16" />
      </g>
    </svg>
  )
}

export function IconePessoa({ grupo = false }) {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true" focusable="false">
      <circle cx="23" cy="23" r="23" fill="#dcdce2" />
      <g fill="none" stroke="#111" strokeWidth="2.4" strokeLinejoin="round">
        {grupo ? (
          <path d="M11 33V14h24v19zM11 29l8-8 6 6 4-4 6 6" />
        ) : (
          <>
            <circle cx="23" cy="17" r="6" />
            <path d="M11 36v-2c0-5 4-8 9-8h6c5 0 9 3 9 8v2z" />
          </>
        )}
      </g>
    </svg>
  )
}

const tracos = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconePasta() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" focusable="false">
      <path {...tracos} d="M3 7h7l2 2.5h11V21H3zM3 12h20" />
    </svg>
  )
}

export function IconeMicrofone() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" focusable="false">
      <rect {...tracos} x="9" y="3" width="8" height="13" rx="4" />
      <path {...tracos} d="M5 12a8 8 0 0 0 16 0M13 20v3" />
    </svg>
  )
}

export function IconeParar() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" focusable="false">
      <rect x="6" y="6" width="14" height="14" rx="3" fill="currentColor" />
    </svg>
  )
}

export function IconeEnviar() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" focusable="false">
      <path {...tracos} d="M3 13L23 4l-5 18-5-7zM13 15l10-11" />
    </svg>
  )
}
