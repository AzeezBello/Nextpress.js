import Link from "next/link";
import { BookOpenText, Files, Image, LayoutDashboard, Settings2, Layers3 } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/pages", label: "Pages", icon: Files },
  { href: "/posts", label: "Posts", icon: BookOpenText },
  { href: "/media", label: "Media library", icon: Image },
  { href: "/settings", label: "Settings", icon: Settings2 }
];

export function SidebarNav({ active }: { active: string }) {
  return (
    <aside className="flex w-full flex-col border-b border-line bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:p-5">
      <Link href="/" className="flex items-center gap-3 px-2 py-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white">
          <Layers3 size={20} aria-hidden="true" />
        </span>
        <span className="font-semibold tracking-tight">NextPress<span className="text-brand">.js</span></span>
      </Link>
      <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Workspace</p>
      <nav aria-label="Main navigation" className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:flex md:flex-col">
        {items.map(({ href, label, icon: Icon }) => {
          const selected = active === href;
          return (
            <Link key={href} href={href} aria-current={selected ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${selected ? "bg-brand-soft font-semibold text-brand" : "text-muted hover:bg-canvas hover:text-ink"}`}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden rounded-2xl bg-canvas p-4 md:block">
        <p className="text-sm font-semibold">Starter scaffold</p>
        <p className="mt-1 text-xs leading-5 text-muted">Authentication and persistence are not connected yet.</p>
      </div>
    </aside>
  );
}
