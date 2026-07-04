import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-bewusste Drop-in-Ersatzstücke für next/link & next/navigation:
// <Link href="/save-button"> führt automatisch zu /save-button bzw. /en/save-button.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
