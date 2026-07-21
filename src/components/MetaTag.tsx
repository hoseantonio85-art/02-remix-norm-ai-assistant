import type { ReactNode } from "react";

export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

export function MetaTag({ children }: { children: ReactNode }) {
  return <span className="np-metatag">{children}</span>;
}

export function KnowledgeCountTag({ count }: { count: number }) {
  const word = pluralRu(count, ["знание", "знания", "знаний"]);
  return <MetaTag>{count} {word}</MetaTag>;
}

export function SourceCountTag({ count }: { count: number }) {
  const word = pluralRu(count, ["источник", "источника", "источников"]);
  return <MetaTag>{count} {word}</MetaTag>;
}