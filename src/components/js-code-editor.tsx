'use client';

import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Prec } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { tags } from '@lezer/highlight';

/*
 * The code editor inside the JavaScript playground (CodeMirror 6).
 * White background, JavaScript colors, line numbers, bracket matching, 4-space indent.
 * No suggestions pop up while typing. Ctrl+Space still shows them when wanted.
 * Loaded only when the playground first opens, so lesson pages stay light.
 */

/** Calm colors on white, close to GitHub's light theme. */
const colors = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword, tags.modifier], color: '#cf222e' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: '#116329' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: '#0550ae' },
  { tag: tags.comment, color: '#6e7781', fontStyle: 'italic' },
  { tag: tags.variableName, color: '#953800' },
  { tag: tags.definition(tags.variableName), color: '#953800', fontWeight: '500' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#8250df' },
  { tag: tags.propertyName, color: '#0e7490' },
  { tag: [tags.className, tags.typeName, tags.self], color: '#b0006b' },
  { tag: [tags.punctuation, tags.bracket], color: '#57606a' },
]);

/** The editor's look: white, monospace, fills the space it is given. */
const look = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#ffffff', fontSize: '13px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono, ui-monospace, monospace)', lineHeight: '1.6' },
  '.cm-content': { padding: '12px 0' },
  '.cm-gutters': { backgroundColor: '#ffffff', color: '#8c959f', border: 'none' },
  '.cm-activeLine': { backgroundColor: '#f6f8fa' },
  '.cm-activeLineGutter': { backgroundColor: '#f6f8fa' },
  '&.cm-focused': { outline: 'none' },
});

type Props = {
  initialCode: string;
  onChange: (code: string) => void;
  /** Called on Ctrl+Enter (Cmd+Enter on a Mac). */
  onRun: () => void;
};

export default function JsCodeEditor({ initialCode, onChange, onRun }: Props) {
  const host = useRef<HTMLDivElement>(null);

  // The editor is made once. These refs let it always call the latest callbacks.
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  useEffect(() => {
    onChangeRef.current = onChange;
    onRunRef.current = onRun;
  });

  useEffect(() => {
    if (!host.current) {
      return;
    }

    // Ctrl+Enter runs the code. Highest priority, so it wins over "insert a blank line".
    const runKey = Prec.highest(
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => {
            onRunRef.current();
            return true;
          },
        },
      ]),
    );

    const sendChanges = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initialCode,
        extensions: [
          runKey,
          basicSetup,
          // Don't pop up suggestions while typing (Ctrl+Space still opens them).
          autocompletion({ activateOnTyping: false }),
          keymap.of([indentWithTab]),
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          javascript(),
          syntaxHighlighting(colors),
          look,
          sendChanges,
        ],
      }),
    });

    view.focus();
    return () => view.destroy();
    // The starting code is read once. After that the editor owns the text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="h-full" />;
}
