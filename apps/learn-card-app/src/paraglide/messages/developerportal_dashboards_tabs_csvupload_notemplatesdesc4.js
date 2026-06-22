/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Notemplatesdesc4Inputs */

const en_developerportal_dashboards_tabs_csvupload_notemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create and save templates first to use CSV batch upload`)
};

const es_developerportal_dashboards_tabs_csvupload_notemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea y guarda plantillas primero para usar la carga CSV por lote`)
};

const fr_developerportal_dashboards_tabs_csvupload_notemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez et sauvegardez d'abord des modèles pour utiliser le téléchargement CSV par lot`)
};

const ar_developerportal_dashboards_tabs_csvupload_notemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإنشاء وحفظ القوالب أولاً لاستخدام تحميل CSV المجمع`)
};

/**
* | output |
* | --- |
* | "Create and save templates first to use CSV batch upload" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Notemplatesdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_notemplatesdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Notemplatesdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_notemplatesdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_notemplatesdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_notemplatesdesc4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_notemplatesdesc4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_notemplatesdesc4 as "developerPortal.dashboards.tabs.csvUpload.noTemplatesDesc" }