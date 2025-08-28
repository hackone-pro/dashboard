// src/componentes/iris/DescricaoFormatada.tsx
import React, { Children, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function iconFor(title: string) {
  const t = normalize(title);
  if (t.includes("detec")) return "";
  if (t.includes("evid")) return "";
  if (t.includes("impact")) return "";
  if (t.includes("inform")) return "";
  if (t.includes("classific")) return "";
  if (t.includes("escopo")) return "";
  if (t.includes("linha do tempo") || t.includes("timeline")) return "";
  if (t.includes("conten")) return "";
  if (t.includes("erradic")) return "";
  if (t.includes("investig")) return "";
  if (t.includes("status")) return "";
  if (t.includes("observ")) return "";
  return "▪️";
}

// Extrai de forma segura o primeiro texto de um ReactNode
function firstText(node: React.ReactNode): string {
  const arr = Children.toArray(node);
  for (const c of arr) {
    if (typeof c === "string") return c;
    if (isValidElement(c)) {
      const inner = firstText((c as any).props?.children);
      if (inner) return inner;
    }
  }
  return "";
}

type Props = { texto?: string | null };

export default function DescricaoFormatada({ texto }: Props) {
  if (!texto) return <p className="text-sm text-gray-400">—</p>;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // parseia HTML e depois sanitiza
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        // @ts-ignore
        h2: ({ children }: { children: React.ReactNode }) => {
          const title = firstText(children);
          return (
            <h2 className="text-base text-white font-semibold mt-5 mb-2 flex items-center gap-2">
              <span>{iconFor(title)}</span>
              {children}
            </h2>
          );
        },
        // @ts-ignore
        h3: ({ children }: { children: React.ReactNode }) => {
          const title = firstText(children);
          return (
            <h3 className="text-sm text-white font-semibold mt-5 mb-2 flex items-center gap-2">
              <span>{iconFor(title)}</span>
              {children}
            </h3>
          );
        },
        // @ts-ignore
        h4: ({ children }: { children: React.ReactNode }) => (
          <h4 className="text-sm text-white font-semibold mt-4 mb-2">{children}</h4>
        ),
        // @ts-ignore
        p: ({ children }: { children: React.ReactNode }) => (
          <p className="text-sm text-gray-300 leading-relaxed">{children}</p>
        ),
        // @ts-ignore
        ul: ({ children }: { children: React.ReactNode }) => (
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">{children}</ul>
        ),
        // @ts-ignore
        ol: ({ children }: { children: React.ReactNode }) => (
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">{children}</ol>
        ),
        // @ts-ignore
        li: ({ children }: { children: React.ReactNode }) => (
          <li className="text-sm case-color text-gray-300">{children}</li>
        ),
        a: (props) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 underline hover:text-purple-200"
          />
        ),
        // @ts-ignore
        code: ({ inline, children }: { inline?: boolean; children: React.ReactNode }) =>
          inline ? (
            <code className="px-1.5 py-0.5 rounded bg-[#ffffff12] text-purple-200">{children}</code>
          ) : (
            <pre className="p-3 bg-[#110f24] rounded-md overflow-auto text-sm">
              <code className="text-gray-300">{children}</code>
            </pre>
          ),
        hr: () => <hr className="my-4 border-[#ffffff12]" />,
      }}
    >
      {texto}
    </ReactMarkdown>
  );
}
