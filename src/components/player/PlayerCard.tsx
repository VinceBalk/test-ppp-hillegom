import React from 'react';
import Link from 'next/link';
import '../ui/styles/player-card.css';

type Player = {
  id: string;
  name: string;
  rating?: number;
  status?: 'actief' | 'inactief';
};

type Props = {
  player: Player;
};

export default function PlayerCard({ player }: Props) {
  return (
    <Link href={`/players/${player.id}`} className="player-card">
      <div className="player-card__body">
        <h3 className="player-card__name">{player.name}</h3>
        {player.rating !== undefined && (
          <p className="player-card__rating">Rating: {player.rating.toFixed(1)}</p>
        )}
        {player.status && (
          <span className={`player-card__status player-card__status--${player.status}`}>
            {player.status}
          </span>
        )}
      </div>
    </Link>
  );
}
