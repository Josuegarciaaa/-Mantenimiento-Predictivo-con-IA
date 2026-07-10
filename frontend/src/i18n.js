import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import moment from 'moment';
import 'moment/locale/es'; // Asegurar que el locale 'es' está cargado

import esTranslation from './locales/es.json';
import enTranslation from './locales/en.json';

const resources = {
  en: {
    translation: enTranslation
  },
  es: {
    translation: esTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // idioma por defecto
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

i18n.on('languageChanged', (lng) => {
  moment.locale(lng === 'es' ? 'es' : 'en');
});
moment.locale(i18n.language === 'es' ? 'es' : 'en');

export default i18n;
