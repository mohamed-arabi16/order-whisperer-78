import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import arTranslations from "@/i18n/ar.json";
import enTranslations from "@/i18n/en.json";

type Language = "ar" | "en";
type Translations = typeof arTranslations;

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

const translations: Record<Language, Translations> = {
  ar: arTranslations,
  en: enTranslations,
};

interface TranslationProviderProps {
  children: ReactNode;
}

/**
 * A component that provides translation context to its children.
 * @param {TranslationProviderProps} props - The component props.
 * @returns {JSX.Element} The rendered translation provider.
 */
export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("ar"); // Default to Arabic

  useEffect(() => {
    // Priority: URL query parameter > localStorage > default
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get("lang") as Language;

    if (langFromUrl && ["ar", "en"].includes(langFromUrl)) {
      setLanguage(langFromUrl);
      localStorage.setItem("language", langFromUrl);
    } else {
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage && ["ar", "en"].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  useEffect(() => {
    // This effect runs whenever the language changes
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;

    // Update meta tags
    const newTranslations = translations[language];
    document.title = newTranslations.meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", newTranslations.meta.description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", newTranslations.meta.og.title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", newTranslations.meta.og.description);
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);

    // Update document direction and lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  const t = (
    key: string,
    variables?: Record<string, string | number>
  ): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found in current language
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === "object" && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in any language
          }
        }
        break;
      }
    }

    let result = typeof value === "string" ? value : key;

    // Replace template variables like {{name}}, {{count}}, etc.
    if (variables && typeof result === "string") {
      result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] !== undefined ? String(variables[key]) : match;
      });
    }

    return result;
  };

  const isRTL = language === "ar";

  return (
    <TranslationContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t, isRTL }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

/**
 * A custom hook for accessing the translation context.
 * @returns {TranslationContextType} The translation context.
 */
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};