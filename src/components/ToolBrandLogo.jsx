import React, { useState } from 'react';
import { extractDomain } from '../utils/domain';

/**
 * ToolBrandLogo Component
 * 
 * Directly renders downloaded local image files from local project storage
 * (e.g. /public/logos/{slug}.png, served as /logos/{slug}.png).
 * Eliminates any reliance on external logo APIs like Brandfetch.
 * 
 * If the image fails to load or the path is unavailable, it gracefully
 * falls back to our styled letter-initial badge with the brand's accent color.
 */
export default function ToolBrandLogo({ tool, size = "md", className = "" }) {
  const [imgError, setImgError] = useState(false);

  // Extract clean domain & safe slug
  const domain = extractDomain(tool?.domain || tool?.website || tool?.affiliateUrl);
  const slug = tool?.slug || (tool?.name ? tool.name.toLowerCase().replace(/[^a-z0-9_-]/gi, '-') : '');

  // Size preset classes
  const sizeClasses = {
    sm: "w-8 h-8 rounded-md p-1.5",
    md: "w-11 h-11 rounded-lg p-2",
    lg: "w-14 h-14 rounded-xl p-2.5",
  }[size] || "w-11 h-11 rounded-lg p-2";

  const imgSizeClasses = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  }[size] || "w-7 h-7";

  // Derive initial letters for styled fallback badge
  const initialLetter = 
    tool?.logoLetter || 
    (tool?.name ? tool.name.trim().substring(0, 2).toUpperCase() : '?');

  // Styled letter-initial fallback badge
  const renderFallbackBadge = () => (
    <div
      className="w-full h-full rounded flex items-center justify-center font-bold text-white text-xs sm:text-sm uppercase font-mono shadow-inner select-none transition-colors"
      style={{ backgroundColor: tool?.brandColor || '#18181b' }}
      aria-label={`${tool?.name || 'Tool'} fallback badge`}
    >
      {initialLetter}
    </div>
  );

  // Determine local image path
  const localLogoPath = 
    (tool?.localLogoPath && typeof tool.localLogoPath === 'string') 
      ? tool.localLogoPath 
      : (slug ? `/logos/${slug}.png` : null);

  // If image errored or no valid local path exists, immediately render the styled letter badge
  if (imgError || !localLogoPath) {
    return (
      <div
        className={`${sizeClasses} relative flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/80 shadow-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-105 overflow-hidden ${className}`}
        title={`${tool?.name || 'Tool'} (Initial Badge)`}
      >
        {renderFallbackBadge()}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} relative flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/80 shadow-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-105 overflow-hidden ${className}`}
      title={`${tool?.name || domain || 'Tool'} official local logo`}
    >
      <img
        src={localLogoPath}
        alt={`${tool?.name || domain || 'Tool'} official logo`}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`${imgSizeClasses} object-contain rounded select-none filter contrast-[1.03] transition-opacity duration-200`}
      />
    </div>
  );
}
