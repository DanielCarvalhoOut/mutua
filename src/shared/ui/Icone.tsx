// Ícones de traço em SVG inline (sem dependência externa).

const CAMINHOS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  menos: 'M6 12h12',
  voltar: 'M15 5l-7 7 7 7',
  avancar: 'M9 5l7 7-7 7',
  escudo: 'M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z M8.8 12.2l2.2 2.2 4.2-4.4',
  cadeado: 'M7 11V8a5 5 0 0110 0v3 M5.5 11h13v9.5h-13z',
  brilho: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  calendario: 'M4.5 6.5h15v13h-15z M4.5 10.5h15 M8.5 4v4 M15.5 4v4',
  inicio: 'M4 11l8-7 8 7 M6 9.5V20h12V9.5',
  pessoa: 'M12 12a4 4 0 100-8 4 4 0 000 8z M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 11v5.5 M12 7.6v.4',
  coracao: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.5C19.5 15.4 12 20 12 20z',
  lixeira: 'M5 7h14 M10 7V4.5h4V7 M6.5 7l1 13h9l1-13',
  editar: 'M4.5 19.5l1-4L16 5l3 3L8.5 18.5z',
  alerta: 'M12 4L2.8 19.5h18.4z M12 10v4.2 M12 17v.3',
  sol:'M12 16a4 4 0 100-8 4 4 0 000 8z M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4',
  lua: 'M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z',
  auto: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 3v18 M12 7.5a4.5 4.5 0 010 9',
} as const;

export type NomeIcone = keyof typeof CAMINHOS;

export function Icone({ nome, tamanho = 20, titulo }: { nome: NomeIcone; tamanho?: number; titulo?: string }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titulo ? 'img' : undefined}
      aria-hidden={titulo ? undefined : true}
    >
      {titulo && <title>{titulo}</title>}
      <path d={CAMINHOS[nome]} />
    </svg>
  );
}

export function Estrela({ cheia = true, tamanho = 16 }: { cheia?: boolean; tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden className={cheia ? undefined : 'vazia'}>
      <path
        fill="currentColor"
        d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
      />
    </svg>
  );
}
