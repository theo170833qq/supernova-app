import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-content text-gray-100 text-base leading-relaxed break-words">
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </div>
  );
};