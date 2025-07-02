import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CharacterImageProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circular' | 'rounded' | 'square';
  showGlow?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16', 
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
};

const variantMap = {
  circular: 'rounded-full',
  rounded: 'rounded-md',
  square: 'rounded-md'
};

export default function CharacterImage({
  src,
  alt,
  size = 'md',
  variant = 'circular',
  showGlow = true,
  className
}: CharacterImageProps) {
  return (
    <div className={cn('relative', sizeMap[size], className)}>
      {showGlow && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse" />
      )}
      <div className={cn(
        'relative w-full h-full overflow-hidden border-2 border-white/20 shadow-xl',
        variantMap[variant]
      )}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
} 