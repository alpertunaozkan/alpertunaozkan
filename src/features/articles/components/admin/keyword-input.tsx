"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordInputProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  describedBy?: string;
}

/** Anahtar kelime girişi: Enter veya virgül ile ekler, Backspace ile son etiketi siler. */
export function KeywordInput({ id, value, onChange, max = 10, describedBy }: KeywordInputProps) {
  const [draft, setDraft] = useState("");
  const full = value.length >= max;

  function add(raw: string) {
    const keyword = raw.trim().replace(/\s+/g, " ");
    if (!keyword || full) return;
    const exists = value.some((item) => item.toLocaleLowerCase("tr-TR") === keyword.toLocaleLowerCase("tr-TR"));
    if (!exists) onChange([...value, keyword]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-navy-500 focus-within:ring-4 focus-within:ring-navy-500/12",
      )}
    >
      {value.map((keyword) => (
        <span
          key={keyword}
          className="inline-flex items-center gap-1 rounded-full bg-navy-50 py-1 pr-1 pl-3 text-sm text-navy-900 motion-safe:animate-pop-in"
        >
          {keyword}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== keyword))}
            aria-label={`${keyword} anahtar kelimesini kaldır`}
            className="inline-flex size-5 items-center justify-center rounded-full text-navy-700 hover:bg-navy-100"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => add(draft)}
        disabled={full}
        aria-describedby={describedBy}
        placeholder={full ? `En fazla ${max} anahtar kelime` : value.length ? "Ekle…" : "örn. kira tespiti, tahliye"}
        className="h-8 min-w-40 flex-1 border-0 bg-transparent px-1.5 text-[15px] text-navy-950 placeholder:text-slate-400 focus:ring-0 focus:outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
