import type { MetadataRoute } from "next";
import { siteUrl } from "@/app/site";

// O `robots.txt`: a Home inteira liberada aos buscadores, com o caminho do `sitemap.xml`.

// O export estático pede que a rota diga que é gerada uma vez, no build.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("sitemap.xml", siteUrl).href,
  };
}
