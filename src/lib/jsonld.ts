import { t, type Lang } from '../i18n';

/** schema.org description of the app, for search engines. */
export function softwareApp(lang: Lang) {
  const d = t(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Dreamward',
    description: d.meta.description,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Windows, macOS, Linux',
    inLanguage: lang,
    license: 'https://www.gnu.org/licenses/agpl-3.0.html',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: lang === 'he' ? 'https://dreamward.life/he/' : 'https://dreamward.life/',
    codeRepository: 'https://github.com/SufZen/Dreamward',
  };
}
