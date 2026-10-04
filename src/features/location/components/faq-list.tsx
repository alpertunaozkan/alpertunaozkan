import { Plus } from "lucide-react";
import type { FaqItem } from "@/data/kirikkale";

/**
 * SSS listesi — native <details>/<summary> ile JS gerektirmeyen erişilebilir
 * akordeon. Cevaplar düz metindir; "- " ile başlayan satırlar listeye çevrilir.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-navy-900/10 overflow-hidden rounded-2xl border border-navy-900/[0.08] bg-white">
      {items.map((item) => (
        <details key={item.question} className="disclosure group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-cream-50 sm:px-8 [&::-webkit-details-marker]:hidden">
            <span className="font-semibold text-navy-950 sm:text-lg">{item.question}</span>
            <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-navy-900/15 text-navy-800 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none">
              <Plus className="size-4" aria-hidden="true" />
            </span>
          </summary>
          <div className="px-6 pb-6 sm:px-8">
            <FaqAnswer text={item.answer} />
          </div>
        </details>
      ))}
    </div>
  );
}

type AnswerBlock = { type: "paragraph"; text: string } | { type: "list"; items: string[] };

function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  for (const line of text.split("\n").map((value) => value.trim())) {
    if (!line) continue;
    const previous = blocks.at(-1);
    if (line.startsWith("- ")) {
      if (previous?.type === "list") previous.items.push(line.slice(2));
      else blocks.push({ type: "list", items: [line.slice(2)] });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }
  return blocks;
}

function FaqAnswer({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-slate-600">
      {parseAnswer(text).map((block, index) =>
        block.type === "paragraph" ? (
          <p key={index}>{block.text}</p>
        ) : (
          <ul key={index} className="list-disc space-y-1.5 pl-5 marker:text-gold-600">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
