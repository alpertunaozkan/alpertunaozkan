"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import { flattenTables, renameElements } from "@/lib/article-content";
import { countWords } from "@/lib/text";
import { cn } from "@/lib/utils";

interface ContentEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}

type BlockType = "paragraph" | "h2" | "h3";

const BLOCK_OPTIONS: Array<{ value: BlockType; label: string }> = [
  { value: "paragraph", label: "Normal metin" },
  { value: "h2", label: "Başlık" },
  { value: "h3", label: "Alt başlık" },
];

/** Editörün HTML çıktısı: boş içerik "" olur, baştaki/sondaki boş satırlar atılır. */
function serialize(editor: Editor): string {
  if (editor.isEmpty) return "";
  return editor
    .getHTML()
    .replace(/^(?:<p><\/p>)+/, "")
    .replace(/(?:<p><\/p>)+$/, "");
}

/** Word'ün liste maddesi başındaki "1." / "1.2." / "a)" / "(iv)" işaretleri numaralı listedir; diğerleri (•, ·, o, §) madde işaretidir. */
const ORDERED_MARKER = /^\(?(?:[\da-z]+[.)])+$/i;

/**
 * Masaüstü Word listeleri gerçek liste olarak değil, işaretli paragraflar
 * olarak yapıştırılır (`mso-list` stili). Bunlar gerçek madde işaretli /
 * numaralı listeye çevrilir; aksi hâlde sitede elle yazılmış "1." ve "·"
 * karakterleri görünürdü.
 */
function convertWordLists(root: HTMLElement) {
  for (const paragraph of root.querySelectorAll<HTMLElement>("p")) {
    if (!/mso-list:\s*l\d/i.test(paragraph.getAttribute("style") ?? "")) continue;

    const marker = paragraph.querySelector('[style*="mso-list:Ignore" i], [style*="mso-list: Ignore" i]');
    const markerText = marker?.textContent?.replace(/\s+/g, "") ?? "";
    marker?.remove();
    const listTag = ORDERED_MARKER.test(markerText) ? "OL" : "UL";

    const item = paragraph.ownerDocument.createElement("li");
    item.append(...paragraph.childNodes);

    const previous = paragraph.previousElementSibling;
    if (previous?.tagName === listTag && previous.hasAttribute("data-word-list")) {
      previous.append(item);
      paragraph.remove();
    } else {
      const list = paragraph.ownerDocument.createElement(listTag);
      list.setAttribute("data-word-list", "");
      list.append(item);
      paragraph.replaceWith(list);
    }
  }
}

const BLOCK_TAG = /^(P|H[1-6]|UL|OL|TABLE|BLOCKQUOTE|DIV)$/;
const TEXT_CONTAINER = "p, li, h1, h2, h3, h4, h5, h6, td, th";

/** Boşluk metni ve yorumlar atlanarak bir sonraki/önceki kardeş düğüm. */
function adjacentNode(node: Node, direction: "previousSibling" | "nextSibling"): Node | null {
  let current = node[direction];
  while (
    current &&
    (current.nodeType === Node.COMMENT_NODE || (current.nodeType === Node.TEXT_NODE && !current.textContent?.trim()))
  ) {
    current = current[direction];
  }
  return current;
}

/**
 * Paragraflar arasına boş satır olarak konan Word paragrafları
 * (`<p>&nbsp;</p>`) ve Google Dokümanlar `<br>`'leri atılır: sitede
 * paragraflar arasında zaten boşluk vardır, bunlar çift boşluk yaratırdı.
 * Satır içindeki `<br>`'ler (Shift+Enter) korunur.
 */
function removeBlankLines(root: HTMLElement) {
  for (const paragraph of root.querySelectorAll("p")) {
    // trim() bölünmez boşluğu (&nbsp;) da siler.
    if (!paragraph.textContent?.trim()) paragraph.remove();
  }
  for (const lineBreak of root.querySelectorAll("br")) {
    if (lineBreak.parentElement?.closest(TEXT_CONTAINER)) continue;
    const isBetweenBlocks = [adjacentNode(lineBreak, "previousSibling"), adjacentNode(lineBreak, "nextSibling")].every(
      (node) => node === null || (node instanceof Element && BLOCK_TAG.test(node.tagName)),
    );
    if (isBetweenBlocks) lineBreak.remove();
  }
}

/**
 * Word / Google Dokümanlar'dan yapıştırılan içeriği sitenin yapısına uyarlar:
 * Başlık 1 → Başlık, Başlık 4–6 → Alt başlık, Word listeleri → gerçek liste,
 * tablolar → satır satır paragraf, boş satırlar → atılır. Renk, yazı tipi,
 * boyut gibi biçimler editörün şemasında olmadığı için kendiliğinden atılır.
 */
function normalizePastedHtml(html: string): string {
  const { body } = new DOMParser().parseFromString(html, "text/html");
  renameElements(body, "h1", "h2");
  renameElements(body, "h4, h5, h6", "h3");
  convertWordLists(body);
  flattenTables(body);
  removeBlankLines(body);
  return body.innerHTML;
}

/** Kullanıcının yazdığı adresi geçerli bir bağlantıya çevirir. */
function normalizeUrl(input: string): string {
  const url = input.trim();
  if (!url) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(url)) return `mailto:${url}`;
  return `https://${url.replace(/^\/+/, "")}`;
}

const subscribeNoop = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

/**
 * Makale içerik editörü (Tiptap). Avukat metni doğrudan, sitedeki makale
 * sayfasında görüneceği yazı stiliyle (`.prose-legal`) yazar; HTML etiketi
 * görmez. Değer, eskisi gibi temiz HTML dizesidir; sunucu kaydetmeden önce
 * aynı kurallarla yeniden temizler (article-content.ts).
 */
export function ContentEditor({ id, value, onChange, invalid, describedBy }: ContentEditorProps) {
  const onChangeRef = useRef(onChange);
  const lastEmitted = useRef(value);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const apple = useSyncExternalStore(subscribeNoop, isApplePlatform, () => false);
  const mod = apple ? "⌘" : "Ctrl";

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      Placeholder.configure({
        placeholder: "Makale metnini buraya yazın veya Word / Google Dokümanlar'dan yapıştırın…",
      }),
    ],
    content: value,
    // Kayıtlı içerik açılırken yazarın boşlukları korunur (varsayılan: tek boşluğa indirilir).
    parseOptions: { preserveWhitespace: true },
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Makale içeriği",
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        class: "prose-legal min-h-[26rem] px-5 py-5 focus:outline-none sm:px-8 sm:py-7",
      },
      transformPastedHTML: normalizePastedHtml,
    },
    onUpdate: ({ editor: current }) => {
      const html = serialize(current);
      lastEmitted.current = html;
      onChangeRef.current(html);
    },
  });

  // Değer dışarıdan değişirse (ör. form sıfırlama) editör içeriği güncellenir.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(value || "", { emitUpdate: false, parseOptions: { preserveWhitespace: true } });
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return null;
      const block: BlockType = current.isActive("heading", { level: 2 })
        ? "h2"
        : current.isActive("heading", { level: 3 })
          ? "h3"
          : "paragraph";
      return {
        block,
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        strike: current.isActive("strike"),
        bulletList: current.isActive("bulletList"),
        orderedList: current.isActive("orderedList"),
        blockquote: current.isActive("blockquote"),
        link: current.isActive("link"),
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
      };
    },
  });

  function setBlock(block: BlockType) {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (block === "paragraph") chain.setParagraph().run();
    else chain.setHeading({ level: block === "h2" ? 2 : 3 }).run();
  }

  function openLinkPanel() {
    if (!editor) return;
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkOpen(true);
  }

  function closeLinkPanel() {
    setLinkOpen(false);
    editor?.commands.focus();
  }

  function applyLink() {
    if (!editor) return;
    const href = normalizeUrl(linkUrl);
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else if (editor.state.selection.empty && !editor.isActive("link")) {
      // Seçili metin yoksa adresin kendisi bağlantı olarak eklenir.
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: href.replace(/^mailto:/, ""), marks: [{ type: "link", attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
  }

  function handleLinkKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter makale formunu göndermesin; bağlantıyı uygular.
    if (event.key === "Enter") {
      event.preventDefault();
      applyLink();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeLinkPanel();
    }
  }

  // Sayım, yayın doğrulamasıyla aynı yöntemle (kaydedilecek HTML üzerinden) yapılır.
  const words = countWords(value);

  return (
    <div
      className={cn(
        "overflow-clip rounded-xl border bg-white transition-[border-color,box-shadow] focus-within:border-navy-500 focus-within:ring-4 focus-within:ring-navy-500/12",
        invalid ? "border-red-500" : "border-slate-300",
      )}
    >
      <div className="sticky top-16 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
        {/*
          Telefonda tek satır (yana kaydırılır); geniş ekranda sığmayan düğmeler
          alt satıra geçer. contain-inline-size: satırın toplam genişliği form
          sütununu genişletmesin, satır kendi içinde kaysın.
        */}
        <div
          role="toolbar"
          aria-label="Metin biçimlendirme"
          aria-controls={id}
          className="flex items-center gap-1 overflow-x-auto overscroll-x-contain py-1.5 pr-6 pl-2 [scrollbar-width:none] mask-r-from-[calc(100%-1.5rem)] contain-inline-size *:shrink-0 sm:flex-wrap sm:overflow-visible sm:pr-2 sm:mask-none"
        >
          <Select
            id={`${id}-block`}
            aria-label="Metin biçimi"
            value={state?.block ?? "paragraph"}
            onChange={(event) => setBlock(event.target.value as BlockType)}
            disabled={!editor}
            wrapperClassName="w-40"
            className="h-9 bg-white text-sm"
          >
            {BLOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Divider />
          <ToolButton label="Kalın" shortcut={`${mod}+B`} active={state?.bold} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold />
          </ToolButton>
          <ToolButton label="İtalik" shortcut={`${mod}+I`} active={state?.italic} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic />
          </ToolButton>
          <ToolButton label="Altı çizili" shortcut={`${mod}+U`} active={state?.underline} disabled={!editor} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <Underline />
          </ToolButton>
          <ToolButton label="Üstü çizili" shortcut={`${mod}+Shift+S`} active={state?.strike} disabled={!editor} onClick={() => editor?.chain().focus().toggleStrike().run()}>
            <Strikethrough />
          </ToolButton>

          <Divider />
          <ToolButton label="Madde işaretli liste" shortcut={`${mod}+Shift+8`} active={state?.bulletList} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List />
          </ToolButton>
          <ToolButton label="Numaralı liste" shortcut={`${mod}+Shift+7`} active={state?.orderedList} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered />
          </ToolButton>
          <ToolButton label="Alıntı" shortcut={`${mod}+Shift+B`} active={state?.blockquote} disabled={!editor} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote />
          </ToolButton>
          <ToolButton label={state?.link ? "Bağlantıyı düzenle" : "Bağlantı ekle"} active={state?.link || linkOpen} disabled={!editor} onClick={openLinkPanel}>
            <Link2 />
          </ToolButton>

          <Divider />
          <ToolButton label="Biçimlendirmeyi temizle" disabled={!editor} onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>
            <RemoveFormatting />
          </ToolButton>
          <ToolButton label="Geri al" shortcut={`${mod}+Z`} disabled={!state?.canUndo} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 />
          </ToolButton>
          <ToolButton label="Yinele" shortcut={`${mod}+Shift+Z`} disabled={!state?.canRedo} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 />
          </ToolButton>
        </div>

        {linkOpen ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-3 py-2 motion-safe:animate-fade-in">
            <label htmlFor={`${id}-link`} className="text-sm font-medium text-navy-950">
              Bağlantı adresi
            </label>
            <Input
              id={`${id}-link`}
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={handleLinkKeyDown}
              placeholder="örn. www.yargitay.gov.tr"
              inputMode="url"
              autoComplete="off"
              autoFocus
              className="h-9 min-w-0 flex-1 basis-56 text-sm"
            />
            <Button size="sm" onClick={applyLink}>
              Uygula
            </Button>
            {state?.link ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  editor?.chain().focus().extendMarkRange("link").unsetLink().run();
                  setLinkOpen(false);
                }}
              >
                Bağlantıyı kaldır
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={closeLinkPanel}>
              Vazgeç
            </Button>
          </div>
        ) : null}
      </div>

      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="prose-legal min-h-[26rem] px-5 py-5 text-slate-400 sm:px-8 sm:py-7" aria-hidden="true">
          Editör yükleniyor…
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
        <span>Yazdığınız metin sitedeki makale sayfasında bu görünümle yayınlanır.</span>
        <span className="tabular-nums">{words} kelime</span>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />;
}

function ToolButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active ?? false}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-navy-950 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[18px]",
        active && "bg-white text-navy-950 shadow-xs ring-1 ring-slate-200",
      )}
    >
      {children}
    </button>
  );
}
