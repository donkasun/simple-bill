import { createContext, useContext, useEffect } from "react";

export type PageTitleContextType = {
  setTitle: (title: string) => void;
};

export const PageTitleContext = createContext<PageTitleContextType | null>(
  null,
);

export function usePageTitle(title: string) {
  const ctx = useContext(PageTitleContext);
  useEffect(() => {
    ctx?.setTitle(title);
  }, [ctx, title]);
}
