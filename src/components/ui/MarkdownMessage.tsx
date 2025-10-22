import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-4 mb-2 text-gray-900">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-3 mb-2 text-gray-900">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-3 mb-1 text-gray-900">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-semibold mt-2 mb-1 text-gray-900">{children}</h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-sm font-semibold mt-2 mb-1 text-gray-900">{children}</h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-xs font-semibold mt-2 mb-1 text-gray-900">{children}</h6>
        ),
        
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 text-gray-800 leading-relaxed">{children}</p>
        ),
        
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1 text-gray-800">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-800">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="ml-4">{children}</li>
        ),
        
        // Code blocks
        code: ({ inline, children, ...props }: any) => {
          if (inline) {
            return (
              <code
                className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className="block bg-gray-900 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        
        // Pre (wraps code blocks)
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto">{children}</pre>
        ),
        
        // Strong (bold)
        strong: ({ children }) => (
          <strong className="font-bold text-gray-900">{children}</strong>
        ),
        
        // Emphasis (italic)
        em: ({ children }) => (
          <em className="italic text-gray-800">{children}</em>
        ),
        
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            {children}
          </a>
        ),
        
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-2 italic text-gray-700 bg-gray-50">
            {children}
          </blockquote>
        ),
        
        // Horizontal rule
        hr: () => <hr className="my-4 border-gray-300" />,
        
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border-collapse border border-gray-300">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-100">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody>{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-gray-300">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 px-4 py-2 text-gray-800">{children}</td>
        ),
        
        // Task lists (GFM)
        input: ({ checked, ...props }: any) => (
          <input
            type="checkbox"
            checked={checked}
            disabled
            className="mr-2 align-middle"
            {...props}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;

