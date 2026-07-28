import { useEffect, useReducer, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import clsx from "clsx";
import { useUploadMedia } from "@/api/media";
import { ApiError } from "@/lib/api";

const TextStyleWithFontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.style.fontSize?.replace(/['"]/g, "") || null,
        renderHTML: (attributes: { fontSize?: string | null }) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

const FONT_FAMILIES: Array<{ label: string; value: string | null }> = [
  { label: "Default", value: null },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: 'Helvetica, Arial, sans-serif' },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: '"Trebuchet MS", sans-serif' },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Garamond", value: 'Garamond, "Apple Garamond", serif' },
  { label: "Palatino", value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { label: "Cambria", value: 'Cambria, Georgia, serif' },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
  { label: "Consolas", value: 'Consolas, "Lucida Console", monospace' },
  { label: "Monaco", value: 'Monaco, "Lucida Console", monospace' },
  { label: "Comic Sans MS", value: '"Comic Sans MS", "Comic Sans", cursive' },
];

const FONT_SIZES: Array<{ label: string; value: string | null }> = [
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: null },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "30", value: "30px" },
  { label: "36", value: "36px" },
  { label: "48", value: "48px" },
];

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  minHeight = 200,
}: Props) {
  const upload = useUploadMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
      }),
      Underline,
      Highlight,
      TextStyleWithFontSize,
      FontFamily,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: clsx("bits-prose focus:outline-none px-4 py-3"),
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  // Force the toolbar to re-render when the cursor moves or marks change.
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", forceUpdate);
    return () => {
      editor.off("selectionUpdate", forceUpdate);
    };
  }, [editor]);

  // Any pointerdown inside the editor surface broadcasts a "close all
  // dropdowns" event. Toolbar dropdowns listen for it and close. This is
  // independent of the document-level outside-click listener — a hard signal.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    function broadcast() {
      document.dispatchEvent(new CustomEvent("bits-close-dropdowns"));
    }
    dom.addEventListener("pointerdown", broadcast);
    return () => dom.removeEventListener("pointerdown", broadcast);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  async function handleImage(file: File) {
    setUploadError(null);
    try {
      const result = await upload.mutateAsync(file);
      editor?.chain().focus().setImage({ src: result.url }).run();
    } catch (e) {
      setUploadError(
        e instanceof ApiError ? e.message : "Image upload failed.",
      );
    }
  }

  function promptLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Link URL", previous);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  if (!editor) {
    return (
      <div className="rounded-md border border-gray-300 bg-white p-4 text-sm text-brand-muted">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green">
      <Toolbar
        editor={editor}
        onImage={() => fileRef.current?.click()}
        onLink={promptLink}
        uploading={upload.isPending}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImage(f);
          e.target.value = "";
        }}
      />
      {uploadError && (
        <div className="border-t border-gray-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {uploadError}
        </div>
      )}
    </div>
  );
}

interface ToolbarProps {
  editor: Editor;
  onImage: () => void;
  onLink: () => void;
  uploading: boolean;
}

function Toolbar({ editor, onImage, onLink, uploading }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-brand-bg p-1">
      <BlockDropdown editor={editor} />
      <FontFamilyDropdown editor={editor} />
      <FontSizeDropdown editor={editor} />

      <Sep />

      <Btn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <span className="text-sm font-bold">B</span>
      </Btn>
      <Btn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <span className="text-sm font-semibold italic">I</span>
      </Btn>
      <Btn
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <span className="text-sm font-semibold underline">U</span>
      </Btn>
      <Btn
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        label="Highlight"
      >
        <span className="rounded bg-brand-green-blob px-1 text-[11px] font-semibold text-brand-charcoal">
          H
        </span>
      </Btn>

      <Sep />

      <Btn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Bullet list"
      >
        <ListIcon variant="bullet" />
      </Btn>
      <Btn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="Numbered list"
      >
        <ListIcon variant="ordered" />
      </Btn>
      <Btn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="Callout"
      >
        <CalloutIcon />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="Horizontal rule"
      >
        <HrIcon />
      </Btn>

      <Sep />

      <Btn active={editor.isActive("link")} onClick={onLink} label="Link">
        <LinkIcon />
      </Btn>
      <Btn onClick={onImage} disabled={uploading} label="Insert image">
        <ImageIcon />
        {uploading && (
          <span className="ml-1 text-[10px] text-brand-muted">…</span>
        )}
      </Btn>
    </div>
  );
}

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Listen for the editor's "close all" broadcast. Always on — covers the
  // common case of clicking into the editor while a dropdown is open.
  useEffect(() => {
    function onCloseAll() {
      setOpen(false);
    }
    document.addEventListener("bits-close-dropdowns", onCloseAll);
    return () =>
      document.removeEventListener("bits-close-dropdowns", onCloseAll);
  }, []);

  // Outside-click + Escape — only registered while open. setTimeout(0)
  // defers registration until after the click that opened it.
  useEffect(() => {
    if (!open) return;
    function onOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const id = window.setTimeout(() => {
      document.addEventListener("pointerdown", onOutside);
    }, 0);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return { open, setOpen, ref };
}

function BlockDropdown({ editor }: { editor: Editor }) {
  const { open, setOpen, ref } = useDropdown();

  let label = "Regular text";
  if (editor.isActive("heading", { level: 2 })) label = "Heading 2";
  else if (editor.isActive("heading", { level: 3 })) label = "Heading 3";

  function pick(action: "p" | "h2" | "h3") {
    if (action === "p") editor.chain().focus().setParagraph().run();
    else if (action === "h2")
      editor.chain().focus().setHeading({ level: 2 }).run();
    else editor.chain().focus().setHeading({ level: 3 }).run();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <DropdownTrigger
        open={open}
        onClick={() => setOpen((o) => !o)}
        label={label}
        widthClass="w-32"
      />
      {open && (
        <DropdownMenu>
          <DropItem
            active={label === "Regular text"}
            onClick={() => pick("p")}
            sample="Regular text"
            sampleClass="text-sm"
          />
          <DropItem
            active={label === "Heading 2"}
            onClick={() => pick("h2")}
            sample="Heading 2"
            sampleClass="text-lg font-bold"
          />
          <DropItem
            active={label === "Heading 3"}
            onClick={() => pick("h3")}
            sample="Heading 3"
            sampleClass="text-base font-semibold"
          />
        </DropdownMenu>
      )}
    </div>
  );
}

function FontFamilyDropdown({ editor }: { editor: Editor }) {
  const { open, setOpen, ref } = useDropdown();
  const current =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) ??
    null;

  const active =
    FONT_FAMILIES.find((f) => f.value === current) ?? FONT_FAMILIES[0];

  function pick(value: string | null) {
    if (value === null) {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(value).run();
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <DropdownTrigger
        open={open}
        onClick={() => setOpen((o) => !o)}
        label={active.label}
        widthClass="w-32"
      />
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-md border border-gray-100 bg-white py-1 shadow-lg">
          {FONT_FAMILIES.map((f) => (
            <DropItem
              key={f.label}
              active={f.value === current}
              onClick={() => pick(f.value)}
              sample={f.label}
              sampleClass="text-sm"
              style={f.value ? { fontFamily: f.value } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FontSizeDropdown({ editor }: { editor: Editor }) {
  const { open, setOpen, ref } = useDropdown();
  const current =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? null;

  const active =
    FONT_SIZES.find((s) => s.value === current) ??
    FONT_SIZES.find((s) => s.value === null)!;

  function pick(value: string | null) {
    if (value === null) {
      editor
        .chain()
        .focus()
        .setMark("textStyle", { fontSize: null })
        .run();
    } else {
      editor.chain().focus().setMark("textStyle", { fontSize: value }).run();
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <DropdownTrigger
        open={open}
        onClick={() => setOpen((o) => !o)}
        label={active.label}
        widthClass="w-14"
      />
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-20 overflow-hidden rounded-md border border-gray-100 bg-white py-1 shadow-lg">
          {FONT_SIZES.map((s) => (
            <button
              key={s.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s.value)}
              className={clsx(
                "flex w-full items-center justify-between px-3 py-1 text-left text-sm transition-colors",
                s.value === current
                  ? "bg-brand-green/10 text-brand-green-dark"
                  : "text-brand-charcoal hover:bg-gray-50",
              )}
            >
              <span>{s.label}</span>
              {s.value === current && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownTrigger({
  open,
  onClick,
  label,
  widthClass,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
  widthClass?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clsx(
        "flex h-8 items-center justify-between gap-1.5 rounded px-2 text-sm font-medium text-brand-charcoal transition-colors",
        widthClass,
        open ? "bg-gray-200" : "hover:bg-gray-100",
      )}
    >
      <span className="truncate">{label}</span>
      <ChevronDown />
    </button>
  );
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-0 top-full z-20 mt-1 min-w-[12rem] overflow-hidden rounded-md border border-gray-100 bg-white py-1 shadow-lg">
      {children}
    </div>
  );
}

function DropItem({
  active,
  onClick,
  sample,
  sampleClass,
  style,
}: {
  active: boolean;
  onClick: () => void;
  sample: string;
  sampleClass: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clsx(
        "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors",
        active ? "bg-brand-green/10" : "hover:bg-gray-50",
      )}
    >
      <span
        className={clsx(sampleClass, "text-brand-charcoal")}
        style={style}
      >
        {sample}
      </span>
      {active && (
        <span className="text-xs text-brand-green-dark">✓</span>
      )}
    </button>
  );
}

interface BtnProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

  function Btn({ active, disabled, onClick, label, children }: BtnProps) {
    return (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        title={label}
        aria-label={label}
        aria-pressed={active}
        className={clsx(
          "inline-flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-brand-charcoal transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          active
            ? "bg-brand-green/15 text-brand-green-dark"
            : "hover:bg-gray-100",
        )}
      >
        {children}
      </button>
    );
  }

function Sep() {
  return <span className="mx-1 h-5 w-px bg-gray-300" />;
}

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M2 4l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListIcon({ variant }: { variant: "bullet" | "ordered" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {variant === "bullet" ? (
        <>
          <circle cx="2" cy="3" r="1" fill="currentColor" />
          <circle cx="2" cy="7" r="1" fill="currentColor" />
          <circle cx="2" cy="11" r="1" fill="currentColor" />
        </>
      ) : (
        <>
          <text x="0" y="4.5" fontSize="4" fill="currentColor">
            1
          </text>
          <text x="0" y="8.5" fontSize="4" fill="currentColor">
            2
          </text>
          <text x="0" y="12.5" fontSize="4" fill="currentColor">
            3
          </text>
        </>
      )}
      <line x1="5" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CalloutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="2.5" y1="2.5" x2="2.5" y2="11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.3" />
      <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.3" />
      <line x1="5" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function HrIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M5.5 8.5L8.5 5.5M6 4l1-1a2.5 2.5 0 013.5 3.5l-1 1M8 10l-1 1a2.5 2.5 0 01-3.5-3.5l1-1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="5.5" r="1" fill="currentColor" />
      <path d="M2 10l3-3 2.5 2.5L10 6l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
