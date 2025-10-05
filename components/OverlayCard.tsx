'use client';

import cls from './OverlayCard.module.css';

export type Side = 'left' | 'right';

export interface OverlayCardProps {
  id: string;
  side: Side;
  color: string;
  text: string;
  shown: boolean;
}

export default function OverlayCard({ id, side, color, text, shown }: OverlayCardProps) {
  const className = [
    cls.card,
    side === 'left' ? cls.left : cls.right,
    shown ? cls.shown : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div id={id} className={className} aria-hidden="true">
      <span className={cls.accent} style={{ backgroundColor: color }} />
      <div className={cls.content}>{text}</div>
    </div>
  );
}
