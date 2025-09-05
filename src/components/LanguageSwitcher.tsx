import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Globe } from "lucide-react";

/**
 * A component that allows the user to switch the application's language.
 * It toggles between English and Arabic.
 *
 * @returns {JSX.Element} The rendered language switcher button.
 */
const LanguageSwitcher = (): JSX.Element => {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      title={t('header.switchLanguage')}
    >
      <Globe size={16} />
      <span className="text-sm font-medium">
        {t('header.languageName')}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;