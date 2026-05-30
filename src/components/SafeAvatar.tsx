import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { resolveAssetUrlCandidates } from '../utils/assets';

interface SafeAvatarProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

const SafeAvatar: React.FC<SafeAvatarProps> = ({
  src,
  alt,
  fallbackText,
  className,
  imgClassName,
  style,
  imgStyle,
  title,
  onClick,
}) => {
  const [failed, setFailed] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setFailed(false);
    setCandidateIndex(0);
  }, [src]);

  const candidates = src && !failed ? resolveAssetUrlCandidates(src) : [];
  const resolvedSrc = candidates[candidateIndex] || '';
  const fallback = fallbackText?.trim()?.charAt(0).toUpperCase();

  return (
    <span
      className={className}
      style={style}
      title={title}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {resolvedSrc ? (
        <img
          className={imgClassName}
          src={resolvedSrc}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgStyle }}
          onError={() => {
            if (candidateIndex < candidates.length - 1) {
              setCandidateIndex((index) => index + 1);
            } else {
              setFailed(true);
            }
          }}
        />
      ) : (
        fallback || <User size={20} />
      )}
    </span>
  );
};

export default SafeAvatar;
