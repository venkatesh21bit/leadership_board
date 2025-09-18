'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { useEffect, useRef, useState } from 'react';

interface ParticipantAvatarProps {
  username: string;
  className?: string;
}

const ParticipantAvatar = ({ username, className }: ParticipantAvatarProps) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Avatar
      ref={ref}
      className={className}
    >
      {isIntersecting ? (
        <AvatarImage
          src={`https://github.com/${username}.png`}
          alt={`${username}'s avatar`}
          loading="lazy"
        />
      ) : null}
      <AvatarFallback>
        <img
          src="/icon_badge.png"
          alt="Fallback"
          loading="lazy"
          className="w-full h-full"
        />
      </AvatarFallback>
    </Avatar>
  );
};

export default ParticipantAvatar;
