import useUserProfile from "@hooks/useUserProfile";
import { useTheme } from "@hooks/useTheme";

export type SettingsPageViewModel = {
  loading: boolean;
  error: string | null;
  profile: ReturnType<typeof useUserProfile>["profile"];
  theme: ReturnType<typeof useTheme>["theme"];
  resolvedTheme: ReturnType<typeof useTheme>["resolvedTheme"];
  actions: {
    setCurrency: (currency: string) => void;
    setTheme: (theme: "light" | "dark" | "system") => void;
  };
};

export function useSettingsPage(): SettingsPageViewModel {
  const { profile, loading, error, updateUserProfile } = useUserProfile();
  const { theme, setTheme, resolvedTheme } = useTheme();

  return {
    loading,
    error,
    profile,
    theme,
    resolvedTheme,
    actions: {
      setCurrency: (currency: string) => {
        void updateUserProfile({ currency });
      },
      setTheme: (value: "light" | "dark" | "system") => {
        setTheme(value);
      },
    },
  };
}
