import type { MetadataRoute } from "next";
import { siteUrl } from "@/app/site";

// O `sitemap.xml`: só a Home, a única página do site. Sem data de mudança, para o arquivo não
// mudar a cada build.

// O export estático pede que a rota diga que é gerada uma vez, no build.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl.href }];
}
