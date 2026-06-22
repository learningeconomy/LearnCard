/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Usepreview4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_usepreview4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Usepreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Preview to test embedding`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_usepreview4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Usepreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa Vista Previa para probar la incrustación`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_usepreview4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Usepreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez Aperçu pour tester l'intégration`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_usepreview4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Usepreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم المعاينة لاختبار التضمين`)
};

/**
* | output |
* | --- |
* | "Use Preview to test embedding" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Usepreview4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_usepreview4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Usepreview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Usepreview4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_usepreview4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_usepreview4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_usepreview4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_usepreview4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_usepreview4 as "developerPortal.dashboards.tabs.appConfig.checkResults.usePreview" }