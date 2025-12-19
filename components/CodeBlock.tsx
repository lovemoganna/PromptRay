import React, { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Icons } from './Icons';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper rounded-theme overflow-hidden my-4 border border-white/10 bg-gray-950/80 group shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900/50 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></span>
          <span className="ml-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
            {language || 'text'}
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
          title="Copy code"
        >
          {isCopied ? (
            <Icons.Check size={14} className="text-green-500" />
          ) : (
            <Icons.Copy size={14} />
          )}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <Highlight theme={themes.vsDark} code={code} language={language || 'text'}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{ ...style, backgroundColor: 'transparent', margin: 0 }}
              className="p-4 text-sm font-mono leading-relaxed"
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
};


