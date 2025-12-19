import React, { useRef, useEffect, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { PromptFormData, Theme } from '../types';
import { Icons } from './Icons';

interface PromptShareImageProps {
  data: PromptFormData;
  theme: Theme;
  onClose?: () => void;
  previewMode?: 'raw' | 'interpolated';
  getCompiledPrompt?: () => string;
}

export const PromptShareImage: React.FC<PromptShareImageProps> = ({
  data,
  theme,
  onClose,
  previewMode = 'raw',
  getCompiledPrompt,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const displayPrompt =
    previewMode === 'interpolated' && getCompiledPrompt
      ? getCompiledPrompt()
      : data.content;

  const systemInstruction = data.systemInstruction || '';

  // Generate image from the visible card
  const generateImage = useCallback(async (): Promise<string | null> => {
    if (!containerRef.current) return null;

    try {
      // Wait a bit for DOM to fully render
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!containerRef.current) return null;

      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setImageDataUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Failed to generate image:', error);
      return null;
    }
  }, []);

  // Generate image when component mounts or data changes
  useEffect(() => {
    if (!containerRef.current) return;
    generateImage();
  }, [data, theme, displayPrompt, systemInstruction, generateImage]);

  const handleDownload = useCallback(async () => {
    let dataUrl = imageDataUrl;

    if (!dataUrl) {
      dataUrl = await generateImage();
    }

    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${data.title || 'prompt'}-share.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageDataUrl, data.title, generateImage]);

  const handleCopyToClipboard = useCallback(async () => {
    let dataUrl = imageDataUrl;

    // If the image is not ready yet, generate it on demand
    if (!dataUrl) {
      dataUrl = await generateImage();
    }

    if (!dataUrl) return;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const anyWindow = window as any;

      // If ClipboardItem is not supported, fallback to copying data URL
      if (!anyWindow.ClipboardItem) {
        await navigator.clipboard.writeText(dataUrl);
        return;
      }

      await navigator.clipboard.write([
        new anyWindow.ClipboardItem({ 'image/png': blob }),
      ]);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: try to copy the image data URL as text
      try {
        await navigator.clipboard.writeText(dataUrl);
      } catch (e) {
        console.error('Failed to copy image data URL:', e);
      }
    }
  }, [imageDataUrl, generateImage]);

  // Get theme colors and calculate appropriate colors
  const brandColor = theme.colors.brand;
  const bgColor = theme.colors.bg;
  const isLightTheme = theme.id === 'theme-light';

  // Calculate accent color (lighter version of brand color for labels)
  const accentColor = lightenColor(brandColor, 0.3);

  // Background color - darker purple-grey tone
  const cardBgColor = isLightTheme
    ? '#f8f9fa'
    : hexToRgba(darkenColor(bgColor, 0.1), 0.98);

  // Text colors
  const primaryTextColor = isLightTheme ? '#1a1a1a' : '#f5f5f5';
  const secondaryTextColor = isLightTheme ? '#6b7280' : '#d1d5db';
  const labelTextColor = accentColor;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Container */}
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: cardBgColor,
            minHeight: '700px',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle Background Pattern - More subtle */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${primaryTextColor} 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-10 md:p-14 lg:p-16 flex flex-col h-full min-h-[700px]">
            {/* Header Section */}
            <div className="mb-10">
              {/* Category Badge */}
              <div className="mb-6">
                <div
                  className="inline-flex px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: isLightTheme
                      ? hexToRgba(brandColor, 0.12)
                      : hexToRgba(brandColor, 0.18),
                    color: brandColor,
                    border: `1px solid ${hexToRgba(brandColor, 0.25)}`,
                  }}
                >
                  {data.category || 'PROMPT'}
                </div>
              </div>

              {/* Title */}
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-5 leading-tight tracking-tight"
                style={{
                  color: primaryTextColor,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {data.title || 'Untitled Prompt'}
              </h1>

              {/* Description */}
              {data.description && (
                <p
                  className="text-lg md:text-xl leading-relaxed max-w-4xl"
                  style={{
                    color: secondaryTextColor,
                  }}
                >
                  {data.description}
                </p>
              )}
            </div>

            {/* Content Sections */}
            <div className="flex-1 space-y-8">
              {/* System Instruction */}
              {systemInstruction && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-1 h-7 rounded-full"
                      style={{ backgroundColor: brandColor }}
                    />
                    <h2
                      className="text-xs font-bold uppercase tracking-[0.15em]"
                      style={{ color: labelTextColor }}
                    >
                      SYSTEM INSTRUCTION
                    </h2>
                  </div>
                  <div
                    className="rounded-xl p-6 border"
                    style={{
                      backgroundColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.02)'
                        : 'rgba(255, 255, 255, 0.04)',
                      borderColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.1)'
                        : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <p
                      className="text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words font-mono"
                      style={{
                        color: primaryTextColor,
                        opacity: 0.92,
                        lineHeight: '1.7',
                      }}
                    >
                      {systemInstruction}
                    </p>
                  </div>
                </div>
              )}

              {/* User Prompt */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-7 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                  <h2
                    className="text-xs font-bold uppercase tracking-[0.15em]"
                    style={{ color: labelTextColor }}
                  >
                    USER PROMPT
                  </h2>
                </div>
                <div
                  className="rounded-xl p-6 border"
                  style={{
                    backgroundColor: isLightTheme
                      ? 'rgba(0, 0, 0, 0.02)'
                      : 'rgba(255, 255, 255, 0.04)',
                    borderColor: isLightTheme
                      ? 'rgba(0, 0, 0, 0.1)'
                      : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <p
                    className="text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words font-mono"
                    style={{
                      color: primaryTextColor,
                      opacity: 0.92,
                      lineHeight: '1.7',
                    }}
                  >
                    {displayPrompt || 'No prompt content'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6">
              <p
                className="text-xs text-center font-mono tracking-wider"
                style={{
                  color: secondaryTextColor,
                  opacity: 0.5,
                }}
              >
                Generated by PromptRay
              </p>
            </div>
          </div>

          {/* Action Buttons - Show on Hover */}
          <div
            className={`absolute top-6 right-6 flex items-center gap-2 z-20 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="px-4 py-2.5 rounded-lg backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center gap-2 border"
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)',
                borderColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.15)',
                color: primaryTextColor,
              }}
              title="Download Image"
            >
              <Icons.Download size={16} />
              <span className="text-sm font-semibold">Download</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyToClipboard();
              }}
              className="px-4 py-2.5 rounded-lg backdrop-blur-md shadow-lg transition-all active:scale-95 flex items-center gap-2 border"
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)',
                borderColor: isLightTheme
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.15)',
                color: primaryTextColor,
              }}
              title="Copy to Clipboard"
            >
              <Icons.Copy size={16} />
              <span className="text-sm font-semibold">Copy</span>
            </button>
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-lg backdrop-blur-md shadow-lg transition-all active:scale-95 border"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                }}
                title="Close"
              >
                <Icons.Close size={16} />
              </button>
            )}
          </div>

          {/* Loading overlay removed from final image to avoid visual noise */}
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 text-gray-500 text-xs font-mono tracking-widest uppercase opacity-70">
          Press ESC to close • Hover over image to show actions
        </div>
      </div>
    </div>
  );
};

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper function to lighten a color
function lightenColor(color: string, amount: number): string {
  try {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    if (isNaN(num)) return color;

    let r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    let g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
    let b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));

    const result = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return (usePound ? '#' : '') + result;
  } catch (e) {
    return color;
  }
}

// Helper function to darken a color
function darkenColor(color: string, amount: number): string {
  try {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    if (isNaN(num)) return color;

    let r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    let g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
    let b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));

    const result = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return (usePound ? '#' : '') + result;
  } catch (e) {
    return color;
  }
}
