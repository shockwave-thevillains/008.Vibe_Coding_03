import { defaultLang, langs, ui, type Lang, type UIKey } from './ui';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (langs as string[]).includes(value);
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey, vars?: Record<string, string | number>): string {
    let text: string = ui[lang][key] ?? ui[defaultLang][key];
    if (vars) {
      for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    }
    return text;
  };
}

export function otherLangs(lang: Lang): Lang[] {
  return langs.filter((l) => l !== lang);
}

export function getStaticLangPaths() {
  return langs.map((lang) => ({ params: { lang } }));
}
