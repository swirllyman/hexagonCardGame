import React, { useState } from 'react';
import { resolveAssetUrl } from '../utils/assetUtils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallback?: React.ReactNode;
}

export const SafeImage: React.FC<SafeImageProps> = ({ src, fallback, alt, className, ...props }) => {
  const [hasError, setHasError] = useState(false);

  const resolvedUrl = resolveAssetUrl(src);

  if (!resolvedUrl || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      {...props}
      src={resolvedUrl}
      alt={alt || ''}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
