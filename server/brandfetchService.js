import './env.js';
import { extractDomain } from './logoService.js';

/**
 * Retrieves the Brandfetch API key from environment variables
 */
export function getBrandfetchApiKey() {
  return process.env.BRANDFETCH_API_KEY ? process.env.BRANDFETCH_API_KEY.trim() : null;
}

/**
 * Checks whether Brandfetch API key is configured on the server
 */
export function isBrandfetchConfigured() {
  const key = getBrandfetchApiKey();
  return Boolean(key && key !== 'your_brandfetch_api_key_here' && key.length > 5);
}

/**
 * Server-side secure Brandfetch Brand API query
 * Queries https://api.brandfetch.io/v2/brands/{domain} with the secret API key.
 * Returns sanitized brand metadata & official asset URLs WITHOUT exposing the key.
 */
export async function queryBrandfetchBrand(domainOrUrl) {
  const domain = extractDomain(domainOrUrl);
  if (!domain) {
    throw new Error('A valid website domain is required.');
  }

  const apiKey = getBrandfetchApiKey();
  if (!isBrandfetchConfigured()) {
    return {
      success: false,
      configured: false,
      domain,
      error: 'BRANDFETCH_API_KEY is not configured in server environment variables (.env)',
      fallbackRecommended: true
    };
  }

  const endpoint = `https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          configured: true,
          status: response.status,
          error: 'Invalid or unauthorized BRANDFETCH_API_KEY',
          fallbackRecommended: true
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          configured: true,
          status: 404,
          error: `Brand '${domain}' was not found in Brandfetch registry`,
          fallbackRecommended: true
        };
      }
      throw new Error(`Brandfetch API responded with status ${response.status}`);
    }

    const brandData = await response.json();

    // Extract official logo assets securely
    let officialLogoUrl = null;
    let officialIconUrl = null;
    let fallbackAssetUrl = null;

    if (Array.isArray(brandData.logos)) {
      // Prioritize icon/symbol for clean square card avatars
      const iconLogo = brandData.logos.find(l => l.type === 'icon' || l.type === 'symbol');
      const standardLogo = brandData.logos.find(l => l.type === 'logo');
      const targetLogo = iconLogo || standardLogo || brandData.logos[0];

      if (targetLogo && Array.isArray(targetLogo.formats)) {
        // Find best format (SVG or high-res PNG)
        const svg = targetLogo.formats.find(f => f.format === 'svg');
        const png = targetLogo.formats.find(f => f.format === 'png');
        const formatObj = svg || png || targetLogo.formats[0];
        if (formatObj?.src) {
          officialIconUrl = formatObj.src;
        }
      }

      if (standardLogo && Array.isArray(standardLogo.formats)) {
        const svg = standardLogo.formats.find(f => f.format === 'svg');
        const png = standardLogo.formats.find(f => f.format === 'png');
        const formatObj = svg || png || standardLogo.formats[0];
        if (formatObj?.src) {
          officialLogoUrl = formatObj.src;
        }
      }
    }

    // Extract primary brand color
    let brandColor = null;
    if (Array.isArray(brandData.colors) && brandData.colors.length > 0) {
      const primary = brandData.colors.find(c => c.type === 'primary') || brandData.colors[0];
      brandColor = primary.hex || null;
    }

    // Return sanitized data — THE API KEY IS NEVER INCLUDED
    return {
      success: true,
      configured: true,
      domain,
      name: brandData.name || null,
      description: brandData.description || null,
      iconUrl: officialIconUrl || officialLogoUrl,
      logoUrl: officialLogoUrl || officialIconUrl,
      brandColor,
      source: 'Brandfetch API (Secure Server Auth)'
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      domain,
      error: err.message,
      fallbackRecommended: true
    };
  }
}

/**
 * Downloads official brand image from Brandfetch asset URL
 */
export async function downloadBrandfetchImage(assetUrl, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(assetUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/*,*/*'
      }
    });

    clearTimeout(id);

    if (!res.ok) {
      throw new Error(`Failed to download asset: HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const arrayBuf = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuf),
      contentType
    };
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}
