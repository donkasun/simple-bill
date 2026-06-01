import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/** Lazy dev color guide page; null in production builds (tree-shaken). */
export const DevColorGuidePage: LazyExoticComponent<ComponentType> | null =
  import.meta.env.DEV ? lazy(() => import("@pages/dev/DevColorGuide")) : null;
