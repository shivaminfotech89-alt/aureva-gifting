import { PRODUCT_IMAGE_PLACEHOLDER } from '../../lib/productImage';
import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export function ImageWithFallback({ src, fallbackSrc = PRODUCT_IMAGE_PLACEHOLDER, alt, className, ...props }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <img
      {...props}
      src={imgSrc || fallbackSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        if (!hasError) {
          setImgSrc(fallbackSrc);
          setHasError(true);
        }
      }}
      loading="lazy"
    />
  );
}
