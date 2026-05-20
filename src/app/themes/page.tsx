import { redirect } from "next/navigation";

/**
 * `/themes` (no slug) — redirects to the home-page catalog section so we
 * have one source of truth for the catalog UI. The Theme detail pages live
 * at /themes/[slug] and link out from this section. If we ever outgrow the
 * home-page section (e.g. > 6 themes), upgrade this to a real index page
 * pulling from prisma.theme.findMany().
 */
export default function ThemesIndex() {
  redirect("/#themes");
}
