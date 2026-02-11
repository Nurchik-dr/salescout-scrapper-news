// scraper/src/core/url.ts
export function absUrl(base: string, href: string) {
  if (!href) return "";
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return "https:" + href;
  if (href.startsWith("/")) return new URL(base).origin + href;
  return new URL(href, base).toString();
}
