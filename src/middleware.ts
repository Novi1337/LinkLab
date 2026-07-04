import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Nur Seiten-Routen durch die i18n-Middleware leiten -
  // API-Routen, Auth-Callback, Next-Interna und statische Dateien bleiben unberührt.
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
