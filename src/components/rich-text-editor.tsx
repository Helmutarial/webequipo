"use client";

import { useEffect, useRef } from "react";
import { renderRichText, sanitizeRichText } from "@/lib/rich-text";

export function RichTextEditor({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editor.current && document.activeElement !== editor.current) editor.current.innerHTML = renderRichText(value); }, [value]);
  const command = (name: string, commandValue?: string) => { editor.current?.focus(); document.execCommand(name, false, commandValue); if (editor.current) onChange(sanitizeRichText(editor.current.innerHTML)); };
  return <div className="rich-text-editor"><div className="rich-text-toolbar" aria-label={`Formato para ${label}`}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("bold")}><b>B</b></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("italic")}><i>I</i></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("underline")}><u>U</u></button><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("insertUnorderedList")}>• Lista</button><label title="Color de texto"><input type="color" defaultValue="#d1b783" onChange={(event) => command("foreColor", event.target.value)} /></label><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("removeFormat")}>Limpiar</button></div><div ref={editor} className="rich-text-input" contentEditable suppressContentEditableWarning role="textbox" aria-label={label} onInput={(event) => onChange(sanitizeRichText(event.currentTarget.innerHTML))} /></div>;
}

export function RichTextDisplay({ value }: { value: string }) { return <div className="rich-text-display" dangerouslySetInnerHTML={{ __html: renderRichText(value) }} />; }
