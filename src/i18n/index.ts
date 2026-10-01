import { en, type Dict } from './en';
import { he } from './he';

export type Lang = 'en' | 'he';
export type { Dict };

const dicts: Record<Lang, Dict> = { en, he };

export function t(lang: Lang): Dict {
  return dicts[lang];
}

/** Site-relative URL that respects the deploy base ("/" or "/dreamward-site/"). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const clean = path.replace(/^\/+/, '');
  return `${base}/${clean}`;
}

/** The home page of a language. */
export function home(lang: Lang): string {
  return url(lang === 'he' ? 'he/' : '');
}

/** The same page in the other language. */
export function alternate(lang: Lang, page: '' | 'privacy/'): string {
  return url((lang === 'he' ? '' : 'he/') + page);
}
