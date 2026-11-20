import { Fragment } from 'react';

/** Shows card text with `code`, **bold** and line breaks. Nothing else is turned into HTML. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\n)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part === '\n') return <br key={index} />;
        if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={index} className="rounded bg-fd-muted px-1.5 py-0.5 text-[0.9em] text-rose-700">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
