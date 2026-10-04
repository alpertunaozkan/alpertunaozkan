/*
 * Makale içeriği (HTML) için tek temizleme ve uyarlama noktası.
 *
 * Aynı kurallar hem sunucuda (site ve panel verisi; bkz. article-content.server.ts)
 * hem tarayıcıda (panel önizlemesi) uygulanır; yalnızca HTML ayrıştırıcı farklıdır.
 * Böylece editörde yazılan, önizlemede ve sitede birebir aynı yapıyla görünür.
 *
 * - İzinli etiketler: p, h2, h3, ul, ol, li, strong, em, u, s, a, blockquote, br.
 *   Diğer etiketler kaldırılır (metinleri korunur); script, iframe gibi
 *   etiketler içerikleriyle birlikte silinir. Nitelikler atılır; yalnızca
 *   güvenli bağlantı adresi (href) kalır.
 * - Eski editörün (Quill 2) çıktısı uyarlanır: Quill tüm listeleri <ol> ve
 *   <li data-list="bullet|ordered"> olarak yazar; doğru madde işaretli /
 *   numaralı listeye çevrilir. Quill'in boş satırları (<p><br></p>) ve boş
 *   başlıkları (<h3><br></h3>) sadeleştirilir.
 * - Etiketsiz düz metin boş satırlardan paragraflara bölünür.
 * - Editörün davranışıyla uyum için: geçersiz iç içe yapılar (ör. <p> içinde
 *   blok) açılır, kök düzeydeki serbest metin paragrafa alınır, blok sonundaki
 *   <br> ve boşluklar atılır, HTML biçimlendirmesinden kalan satır sonları
 *   boşluğa çevrilir. Yazarın kelimeler arasına koyduğu boşluklar korunur.
 */

/** DOMParser arayüzü (tarayıcıda window.DOMParser, sunucuda linkedom). */
export interface HtmlParser {
  parseFromString(source: string, type: "text/html"): Document;
}

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

const ALLOWED = new Set(["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "u", "s", "a", "blockquote", "br"]);
const BLOCKS = new Set(["p", "h2", "h3", "ul", "ol", "li", "blockquote"]);
/** Temizlik öncesi blok sayılan etiketler (<div>'in paragraf mı kapsayıcı mı olduğunu anlamak için). */
const BLOCKISH = new Set([
  ...BLOCKS,
  "h1",
  "h4",
  "h5",
  "h6",
  "div",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "aside",
  "nav",
  "figure",
  "pre",
  "table",
]);
const TEXT_BLOCKS = new Set(["p", "h2", "h3", "li"]);
const RENAMES: Record<string, string> = {
  h1: "h2",
  h4: "h3",
  h5: "h3",
  h6: "h3",
  b: "strong",
  i: "em",
  strike: "s",
  del: "s",
};
/** İçerikleriyle birlikte silinen etiketler. */
const DROPPED = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "noscript",
  "noembed",
  "template",
  "svg",
  "math",
  "form",
  "input",
  "textarea",
  "select",
  "button",
  "img",
  "picture",
  "video",
  "audio",
  "canvas",
  "head",
  "title",
  "meta",
  "link",
  "base",
]);
const SAFE_URL = /^(https?:|mailto:|tel:|\/(?!\/)|#)/i;

const name = (node: Node): string => (node.nodeType === ELEMENT_NODE ? (node as Element).localName : "");
const isBlock = (node: Node | null): boolean => !!node && BLOCKS.has(name(node));
const isBlank = (node: Node): boolean => node.nodeType === TEXT_NODE && !node.nodeValue?.trim();

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Blok etiketi içermeyen içeriği (eski kayıtlarda görülen düz metin) boş
 * satırlardan paragraflara böler; tek satır sonları <br> olur.
 */
function textToParagraphs(source: string, isPlainText: boolean): string {
  return source
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${(isPlainText ? escapeText(block) : block).replace(/[ \t]*\n[ \t]*/g, "<br>")}</p>`)
    .join("");
}

export function renameElements(root: ParentNode, selector: string, tagName: string): void {
  for (const element of Array.from(root.querySelectorAll(selector))) {
    const replacement = element.ownerDocument.createElement(tagName);
    replacement.append(...Array.from(element.childNodes));
    element.replaceWith(replacement);
  }
}

/**
 * Tablolar desteklenmez: her satır, hücreleri " – " ile ayrılmış bir paragraf
 * olur; böylece hücre metinleri birbirine yapışmaz.
 */
export function flattenTables(root: ParentNode): void {
  for (const table of Array.from(root.querySelectorAll("table"))) {
    const rows = Array.from(table.querySelectorAll("tr")).filter((row) => row.closest("table") === table);
    const lines = rows
      .map((row) =>
        Array.from(row.children)
          .filter((cell) => cell.localName === "td" || cell.localName === "th")
          .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .join(" – "),
      )
      .filter(Boolean);
    table.replaceWith(
      ...lines.map((line) => {
        const paragraph = table.ownerDocument.createElement("p");
        paragraph.textContent = line;
        return paragraph;
      }),
    );
  }
}

/** Quill 2 listeleri: <ol><li data-list="bullet">… → <ul><li>…; karışık listeler gruplara ayrılır. */
function convertQuillLists(root: Element): void {
  for (const list of Array.from(root.querySelectorAll("ol, ul"))) {
    const items = Array.from(list.children).filter((child) => child.localName === "li");
    if (!items.some((item) => item.hasAttribute("data-list"))) continue;

    const document = list.ownerDocument;
    const groups: Element[] = [];
    let current: Element | null = null;
    for (const item of items) {
      const kind = item.getAttribute("data-list");
      const tag = kind === "ordered" ? "ol" : kind ? "ul" : list.localName;
      if (!current || current.localName !== tag) {
        current = document.createElement(tag);
        groups.push(current);
      }
      current.append(item);
    }
    list.replaceWith(...groups);
  }
  for (const marker of Array.from(root.querySelectorAll("span.ql-ui, span.ql-cursor"))) marker.remove();
}

/** İzinli olmayan etiketleri kaldırır, nitelikleri temizler, bağlantıları güvenli hâle getirir. */
function sanitizeTree(node: Element): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === COMMENT_NODE) {
      child.remove();
      continue;
    }
    if (child.nodeType !== ELEMENT_NODE) continue;

    let element = child as Element;
    if (DROPPED.has(element.localName)) {
      element.remove();
      continue;
    }

    const renamed = RENAMES[element.localName];
    if (renamed) {
      const replacement = element.ownerDocument.createElement(renamed);
      replacement.append(...Array.from(element.childNodes));
      element.replaceWith(replacement);
      element = replacement;
    }

    // Blok içermeyen <div> bir paragraftır (ör. yapıştırılmış içerik).
    if (element.localName === "div" && !Array.from(element.querySelectorAll("*")).some((inner) => BLOCKISH.has(inner.localName))) {
      const paragraph = element.ownerDocument.createElement("p");
      paragraph.append(...Array.from(element.childNodes));
      element.replaceWith(paragraph);
      element = paragraph;
    }

    sanitizeTree(element);

    if (!ALLOWED.has(element.localName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    const href = element.localName === "a" ? element.getAttribute("href")?.trim() ?? "" : "";
    for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);

    if (element.localName === "a") {
      if (!SAFE_URL.test(href)) {
        element.replaceWith(...Array.from(element.childNodes));
        continue;
      }
      element.setAttribute("href", href);
      // Dış bağlantılar yeni sekmede açılır (editörle aynı).
      if (/^https?:/i.test(href)) {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
    }
  }
}

/** <p>, <h2>, <h3> içinde blok bulunamaz; bu durumda dıştaki etiket açılır. */
function fixInvalidNesting(root: Element): void {
  for (const element of Array.from(root.querySelectorAll("p, h2, h3")).reverse()) {
    if (Array.from(element.children).some((child) => isBlock(child))) {
      element.replaceWith(...Array.from(element.childNodes));
    }
  }
}

/** Kök ve alıntı düzeyindeki serbest metni/satır içi etiketleri paragrafa alır (editör de böyle yapar). */
function wrapInlineRuns(container: Element): void {
  let run: Node[] = [];
  const flush = (before: Node | null) => {
    if (run.some((node) => !isBlank(node))) {
      const paragraph = container.ownerDocument.createElement("p");
      container.insertBefore(paragraph, before);
      paragraph.append(...run);
    }
    run = [];
  };
  for (const child of Array.from(container.childNodes)) {
    if (isBlock(child)) flush(child);
    else run.push(child);
  }
  flush(null);
}

/** Bir metin bloğunun (iç içe bloklar hariç) metin düğümleri, belge sırasıyla. */
function inlineTextNodes(block: Element): Text[] {
  const nodes: Text[] = [];
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === TEXT_NODE) nodes.push(child as Text);
      else if (child.nodeType === ELEMENT_NODE && !isBlock(child)) walk(child);
    }
  };
  walk(block);
  return nodes;
}

/** Bloğun sonundaki <br> ve boşluk düğümleri (iç içe satır içi etiketler dahil). */
function trimBlockEnd(block: Element): void {
  let node = block.lastChild;
  while (node) {
    const previous = node.previousSibling;
    if (isBlank(node) || name(node) === "br") {
      node.remove();
    } else if (node.nodeType === ELEMENT_NODE && !isBlock(node)) {
      trimBlockEnd(node as Element);
      if (!node.textContent?.trim() && !(node as Element).querySelector("br")) node.remove();
      else break;
    } else {
      break;
    }
    node = previous;
  }
}

function cleanWhitespace(root: Element): void {
  // Bloklar arasındaki boşluk düğümleri (HTML biçimlendirmesinden kalan) atılır.
  // Liste maddesinde iki satır içi etiket arasındaki boşluk ise kelime aralığıdır, korunur.
  for (const container of [root, ...Array.from(root.querySelectorAll("ul, ol, blockquote, li"))]) {
    for (const child of Array.from(container.childNodes)) {
      if (!isBlank(child)) continue;
      const previous = child.previousSibling;
      const next = child.nextSibling;
      const betweenBlocks = !previous || !next || isBlock(previous) || isBlock(next);
      if (container.localName !== "li" || betweenBlocks) child.remove();
    }
  }

  for (const block of Array.from(root.querySelectorAll("p, h2, h3, li"))) {
    const texts = inlineTextNodes(block);
    texts.forEach((text, index) => {
      let value = text.nodeValue ?? "";
      // Satır sonu / sekme içeren boşluk dizileri biçimlendirme kalıntısıdır.
      if (index === 0) value = value.replace(/^[ \t]*[\r\n\t][\s]*/, "");
      if (index === texts.length - 1) value = value.replace(/[\s]*[\r\n\t][ \t]*$/, "");
      value = value.replace(/[ \t]*[\r\n\t][\s]*/g, " ");
      text.nodeValue = value;
    });
    // Blok sonundaki boşluklar görünmez; editörde de kaydedilmez.
    const last = texts[texts.length - 1];
    if (last && TEXT_BLOCKS.has(block.localName)) last.nodeValue = (last.nodeValue ?? "").replace(/[ \t\u00a0]+$/, "");
    for (const text of texts) if (text.nodeValue === "") text.remove();
  }
}

function cleanEmptyBlocks(root: Element): void {
  for (const block of Array.from(root.querySelectorAll("p, h2, h3, li"))) {
    if (Array.from(block.children).some((child) => isBlock(child))) continue;
    trimBlockEnd(block);
  }
  // Boş başlıklar (Quill: <h3><br></h3>) kaldırılır; sitede de gösterilmez.
  for (const heading of Array.from(root.querySelectorAll("h2, h3"))) {
    if (!heading.textContent?.trim()) heading.remove();
  }
  // Yalnızca <br> içeren paragraf (Quill: <p><br></p>) boş satırdır.
  for (const paragraph of Array.from(root.querySelectorAll("p"))) {
    if (paragraph.textContent?.length || paragraph.querySelector("br")) continue;
    while (paragraph.firstChild) paragraph.firstChild.remove();
  }
  for (const list of Array.from(root.querySelectorAll("ul, ol"))) {
    if (!list.querySelector("li")) list.remove();
  }
  // Baştaki ve sondaki boş satırlar atılır (editör de kaydederken atar).
  const isEmptyParagraph = (node: Node | null) => name(node as Node) === "p" && !node?.firstChild;
  while (root.firstChild && isEmptyParagraph(root.firstChild)) root.firstChild.remove();
  while (root.lastChild && isEmptyParagraph(root.lastChild)) root.lastChild.remove();
}

/** Makale HTML'ini sitenin izin verdiği, editörle birebir uyumlu yapıya getirir. */
export function normalizeArticleHtml(html: string, parser: HtmlParser): string {
  let source = html ?? "";
  if (!source.trim()) return "";

  // Yalnızca bilinen HTML etiketleri HTML sayılır; "<Madde 5>" gibi metinler düz metindir.
  const hasTags = /<\/?(p|br|h[1-6]|ul|ol|li|blockquote|div|span|table|strong|em|b|i|u|s|a|font|section|article)\b[^>]*>/i.test(source);
  const hasBlocks = /<(p|h[1-6]|ul|ol|li|blockquote|div|table|br)\b/i.test(source);
  if (!hasTags || !hasBlocks) source = textToParagraphs(source, !hasTags);

  const document = parser.parseFromString(`<!DOCTYPE html><html><head></head><body>${source}</body></html>`, "text/html");
  const root = document.body;
  if (!root) return "";

  convertQuillLists(root);
  flattenTables(root);
  sanitizeTree(root);
  fixInvalidNesting(root);
  wrapInlineRuns(root);
  for (const quote of Array.from(root.querySelectorAll("blockquote"))) wrapInlineRuns(quote);
  cleanWhitespace(root);
  cleanEmptyBlocks(root);

  return root.innerHTML;
}
