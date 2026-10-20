import React from "react";
import {
  sanitizeUrl,
  validateAndMigrateDocument,
  type ButtonBlockProps,
  type CalloutBlockProps,
  type ColumnsBlockProps,
  type ContentBlock,
  type ContentDocument,
  type DividerBlockProps,
  type HeadingBlockProps,
  type ImageBlockProps,
  type ParagraphBlockProps,
  type TextAlign
} from "@/lib/content-types";

function alignClass(align?: TextAlign): string {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function renderBlock(block: ContentBlock): React.ReactNode {
  switch (block.type) {
    case "heading": {
      const props = block.props as unknown as HeadingBlockProps;
      const align = alignClass(props.align);
      const level = props.level || 2;
      if (level === 1) {
        return (
          <h1
            key={block.id}
            className={`text-3xl font-semibold tracking-tight text-ink sm:text-5xl ${align}`}
          >
            {props.text}
          </h1>
        );
      }
      if (level === 3) {
        return (
          <h3
            key={block.id}
            className={`text-xl font-semibold tracking-tight text-ink sm:text-2xl ${align}`}
          >
            {props.text}
          </h3>
        );
      }
      if (level === 4) {
        return (
          <h4
            key={block.id}
            className={`text-lg font-semibold tracking-tight text-ink ${align}`}
          >
            {props.text}
          </h4>
        );
      }
      return (
        <h2
          key={block.id}
          className={`text-2xl font-semibold tracking-tight text-ink sm:text-3xl ${align}`}
        >
          {props.text}
        </h2>
      );
    }

    case "paragraph": {
      const props = block.props as unknown as ParagraphBlockProps;
      const align = alignClass(props.align);
      return (
        <p
          key={block.id}
          className={`${
            props.lead ? "text-lg leading-8 text-ink/90 sm:text-xl" : "text-base leading-7 text-muted"
          } ${align}`}
        >
          {props.text}
        </p>
      );
    }

    case "image": {
      const props = block.props as unknown as ImageBlockProps;
      const safeSrc = sanitizeUrl(props.url, "/nextpress-mark.svg");
      const ratioClass =
        props.aspectRatio === "16:9"
          ? "aspect-video"
          : props.aspectRatio === "4:3"
            ? "aspect-[4/3]"
            : props.aspectRatio === "1:1"
              ? "aspect-square"
              : "";
      return (
        <figure key={block.id} className="my-2 overflow-hidden rounded-2xl border border-line bg-canvas p-4">
          <div className={`flex items-center justify-center overflow-hidden rounded-xl bg-white p-6 ${ratioClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeSrc}
              alt={props.alt || ""}
              loading="lazy"
              className="max-h-80 w-auto object-contain"
            />
          </div>
          {props.caption ? (
            <figcaption className="mt-3 text-center text-xs text-muted">{props.caption}</figcaption>
          ) : null}
        </figure>
      );
    }

    case "button": {
      const props = block.props as unknown as ButtonBlockProps;
      const safeHref = sanitizeUrl(props.href, "#");
      const wrapperAlign =
        props.align === "center"
          ? "justify-center"
          : props.align === "right"
            ? "justify-end"
            : "justify-start";

      const variantStyle =
        props.variant === "secondary"
          ? "bg-ink text-white hover:bg-brand"
          : props.variant === "outline"
            ? "border border-line bg-white text-ink hover:border-brand hover:text-brand"
            : "bg-brand text-white hover:bg-ink";

      return (
        <div key={block.id} className={`flex ${wrapperAlign}`}>
          <a
            href={safeHref}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${variantStyle}`}
          >
            {props.label || "Learn more"}
          </a>
        </div>
      );
    }

    case "divider": {
      const props = block.props as unknown as DividerBlockProps;
      const pad =
        props.spacing === "sm" ? "py-2" : props.spacing === "lg" ? "py-8" : "py-4";
      if (props.style === "space") {
        return <div key={block.id} className={pad} aria-hidden="true" />;
      }
      if (props.style === "dots") {
        return (
          <div key={block.id} className={`flex justify-center gap-2 text-muted ${pad}`} aria-hidden="true">
            <span>•</span>
            <span>•</span>
            <span>•</span>
          </div>
        );
      }
      return (
        <div key={block.id} className={pad}>
          <hr className="border-t border-line" />
        </div>
      );
    }

    case "callout": {
      const props = block.props as unknown as CalloutBlockProps;
      const toneStyle =
        props.tone === "warning"
          ? "border-[#E6C9A2] bg-[#F8EBD9] text-[#6E4514]"
          : props.tone === "info"
            ? "border-line bg-canvas text-ink"
            : "border-brand/25 bg-brand-soft text-ink";
      return (
        <aside key={block.id} className={`rounded-2xl border p-5 ${toneStyle}`}>
          <p className="text-sm font-semibold">{props.title}</p>
          <p className="mt-1.5 text-sm leading-6 opacity-90">{props.text}</p>
        </aside>
      );
    }

    case "columns": {
      const props = block.props as unknown as ColumnsBlockProps;
      const gridCols = props.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
      const items = Array.isArray(props.items) ? props.items : [];
      return (
        <div key={block.id} className={`grid gap-4 ${gridCols}`}>
          {items.map((item, idx) => (
            <div
              key={`${block.id}_col_${idx}`}
              className="rounded-2xl border border-line bg-white p-5 shadow-xs"
            >
              <h3 className="text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

export function BlockDocumentRenderer({ document }: { document: ContentDocument | unknown }) {
  const { document: safeDoc } = validateAndMigrateDocument(document);

  if (safeDoc.blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
        This document has no content blocks yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {safeDoc.blocks.map((block) => renderBlock(block))}
    </div>
  );
}
