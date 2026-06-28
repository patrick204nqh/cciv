export function TitleHeader() {
  return (
    <div
      style={{
        position: 'fixed',
        top: '8px',
        left: '12px',
        zIndex: 350,
        fontFamily: 'var(--font-serif)',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: '17px',
          letterSpacing: '5px',
          fontWeight: 400,
          color: 'var(--gold)',
          lineHeight: 1,
          textShadow: '0 0 16px rgba(0,0,0,.6)',
        }}
      >
        CCIV
      </div>
      <div
        style={{
          fontSize: '9px',
          letterSpacing: '2px',
          color: 'var(--ink-muted)',
          lineHeight: 1,
          marginTop: '4px',
          textShadow: '0 0 12px rgba(0,0,0,.6)',
        }}
      >
        THE VESSEL
      </div>
    </div>
  );
}
