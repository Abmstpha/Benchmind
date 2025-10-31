/**
 * Modern Markdown Renderer Component
 * Converts markdown text to beautifully formatted HTML with modern styling
 */

import React from 'react';

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, className = "" }) => {
  const formatMarkdown = (text: string) => {
    // First, protect URLs by replacing them with placeholders
    const urlPlaceholders: { [key: string]: string } = {};
    let urlCounter = 0;
    
    const textWithPlaceholders = text.replace(/(https?:\/\/[^\s<>\)\]\}\,\;]+)/g, (url) => {
      // Clean up URLs that might have trailing punctuation or weird characters
      const cleanUrl = url.replace(/[^\w\-\.\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\%]+$/, '');
      const placeholder = `__URL_PLACEHOLDER_${urlCounter}__`;
      urlPlaceholders[placeholder] = cleanUrl;
      urlCounter++;
      return placeholder;
    });
    
    const formatted = textWithPlaceholders
      // Horizontal rules (---)
      .replace(/^---+$/gm, '<hr class="my-6 border-t-2 border-gray-200" />')
      
      // ### Headers (e.g., "### mistral-tiny")
      .replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-3 pb-2 border-b-2 border-green-200 flex items-center"><span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>$1</h3>')
      
      // Section headers with modern styling
      .replace(/^\*\*([A-Z][^*:]+):\*\*$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-3 pb-2 border-b-2 border-blue-200 flex items-center"><span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm mr-2">📊</span>$1</h3>')
      
      // Model names as headers (e.g., "**mistral-tiny:**")
      .replace(/^\*\*([a-z0-9-]+):\*\*$/gm, '<h4 class="text-base font-bold text-gray-900 mt-4 mb-2 pb-1 border-b border-gray-200 flex items-center"><span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>$1</h4>')
      
      // **bold** to <strong> (process before italic) - but avoid URL placeholders
      .replace(/\*\*([^*]+)\*\*/g, (match, content) => {
        if (content.includes('__URL_PLACEHOLDER_')) return match;
        return `<strong class="font-semibold text-gray-900 bg-yellow-50 px-1 rounded">${content}</strong>`;
      })
      
      // *italic* to <em> - but avoid URL placeholders
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (match, content) => {
        if (content.includes('__URL_PLACEHOLDER_')) return match;
        return `<em class="italic text-gray-700">${content}</em>`;
      })
      
      // Enhanced bullet points with icons and better styling
      .replace(/^[\*\-•]\s+(.+)$/gm, (_, content) => {
        // Different icons for different types of content
        let icon = '•';
        if (content.toLowerCase().includes('energy') || content.toLowerCase().includes('wh')) {
          icon = '⚡';
        } else if (content.toLowerCase().includes('co2') || content.toLowerCase().includes('emission')) {
          icon = '🌱';
        } else if (content.toLowerCase().includes('cost') || content.toLowerCase().includes('$')) {
          icon = '💰';
        } else if (content.toLowerCase().includes('latency') || content.toLowerCase().includes('ms')) {
          icon = '⚡';
        } else if (content.toLowerCase().includes('winner') || content.toLowerCase().includes('best')) {
          icon = '🏆';
        } else if (content.toLowerCase().includes('performance')) {
          icon = '📈';
        }
        
        return `<li class="flex items-start mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-200">
          <span class="text-lg mr-3 mt-0.5">${icon}</span>
          <span class="text-gray-700 leading-relaxed">${content}</span>
        </li>`;
      })
      
      // Wrap consecutive <li> in <ul> with better styling
      .replace(/((?:<li[^>]*>.*?<\/li>\s*){1,})/gs, '<ul class="space-y-2 my-4 list-none">$1</ul>')
      
      // Enhanced table formatting
      .replace(/\|(.+)\|/g, (_, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        if (cells.some((cell: string) => cell.includes('---'))) {
          return ''; // Skip separator rows
        }
        
        // Check if this is a header row (contains "Model", "Latency", etc.)
        const isHeader = cells.some((cell: string) => 
          ['model', 'latency', 'cost', 'energy', 'co2'].some(keyword => 
            cell.toLowerCase().includes(keyword)
          )
        );
        
        const cellClass = isHeader 
          ? "px-4 py-3 bg-gray-100 font-semibold text-gray-900 border border-gray-300 text-left"
          : "px-4 py-3 border border-gray-300 text-gray-700";
          
        const cellTags = cells.map((cell: string) => `<td class="${cellClass}">${cell}</td>`).join('');
        return `<tr class="${isHeader ? 'bg-gray-50' : 'hover:bg-gray-50'}">${cellTags}</tr>`;
      })
      
      // Wrap table rows with modern styling
      .replace(/(<tr[^>]*>.*<\/tr>\s*)+/gs, '<div class="overflow-x-auto my-6"><table class="w-full border-collapse bg-white rounded-lg shadow-sm border border-gray-200">$&</table></div>')
      
      // Performance metrics formatting (e.g., "1333.44ms", "0.24676 Wh")
      .replace(/(\d+\.?\d*)(ms|Wh|g|USD|\$)/g, '<span class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">$1$2</span>')
      
      // Model names in text (e.g., "mistral-tiny", "mistral-small") - but avoid URL placeholders
      .replace(/\b(mistral-[a-z0-9-]+|gpt-[a-z0-9-]+|claude-[a-z0-9-]+)\b/gi, (match) => {
        if (match.includes('__URL_PLACEHOLDER_')) return match;
        return `<span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">${match}</span>`;
      })
      
      // Line breaks
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      
      // Clean up extra spaces
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    // Restore URLs from placeholders
    return Object.keys(urlPlaceholders).reduce((result, placeholder) => {
      const url = urlPlaceholders[placeholder];
      return result.replace(
        placeholder, 
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">${url}</a>`
      );
    }, formatted);
  };

  return (
    <div 
      className={`markdown-content prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: formatMarkdown(text) }}
    />
  );
};

export default MarkdownRenderer;
