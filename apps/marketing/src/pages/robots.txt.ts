import { getRobotsTxt, getSiteMode } from "../lib/site";

export function GET() {
  const mode = getSiteMode(import.meta.env.PUBLIC_SITE_MODE);
  return new Response(getRobotsTxt(mode, import.meta.env.PUBLIC_SITE_URL), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
