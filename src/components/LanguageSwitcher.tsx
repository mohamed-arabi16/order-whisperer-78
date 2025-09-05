import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Globe size={16} />
      <span className="text-sm font-medium">
        {language === 'ar' ? 'EN' : 'عر'}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;