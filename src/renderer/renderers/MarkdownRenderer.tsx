import React from 'react';
import { ThemeDefinition, themes } from '../themes';
import { BlockData } from '../../types';

interface MarkdownRendererProps {
  block: BlockData;
  theme?: ThemeDefinition;
}

/**
 * Basic markdown parsing for simple formatting
 */
const parseMarkdown = (markdown: string): string => {
  if (!markdown) return '';

  // Convert headers: # Header 1 => <h1>Header 1</h1>
  let html = markdown.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, content) => {
    const level = hashes.length;
    return `<h${level} class="md-heading md-h${level}">${content}</h${level}>`;
  });

  // Convert paragraphs: separate by two new lines
  html = html.replace(/\n\n([^#].*?)\n\n/gs, (_, content) => {
    return `\n\n<p class="md-paragraph">${content}</p>\n\n`;
  });

  // Ensure single newlines are preserved with <br />
  html = html.replace(/(?<!\n)\n(?!\n)/g, '<br />');

  // Convert bold: **text** => <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert italic: *text* => <em>text</em>
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Convert links: [text](url) => <a href="url">text</a>
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="md-link">$1</a>');

  // Convert unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*?)(?=\n\s*[-*+]|\n\n|$)/gms, (_, content) => {
    return `<li class="md-list-item">${content}</li>`;
  });
  html = html.replace(/(<li class="md-list-item">.*?<\/li>)+/gs, '<ul class="md-list">$&</ul>');

  // Convert ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*?)(?=\n\s*\d+\.|\n\n|$)/gms, (_, content) => {
    return `<li class="md-list-item">${content}</li>`;
  });
  html = html.replace(/(<li class="md-list-item">.*?<\/li>)+/gs, '<ol class="md-list">$&</ol>');

  return html;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ block, theme = null }) => {
  const themeConfig = theme ?? themes.default;

  // Parse the markdown content to HTML
  const html = parseMarkdown(block.text || '');

  return (
    <div
      className="survey-markdown w-full min-w-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
