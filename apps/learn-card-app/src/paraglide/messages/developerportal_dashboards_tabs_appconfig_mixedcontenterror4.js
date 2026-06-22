/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Mixedcontenterror4Inputs */

const en_developerportal_dashboards_tabs_appconfig_mixedcontenterror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Mixedcontenterror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mixed content error?`)
};

const es_developerportal_dashboards_tabs_appconfig_mixedcontenterror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Mixedcontenterror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Error de contenido mixto?`)
};

const fr_developerportal_dashboards_tabs_appconfig_mixedcontenterror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Mixedcontenterror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur de contenu mixte ?`)
};

const ar_developerportal_dashboards_tabs_appconfig_mixedcontenterror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Mixedcontenterror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في المحتوى المختلط؟`)
};

/**
* | output |
* | --- |
* | "Mixed content error?" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Mixedcontenterror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_mixedcontenterror4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Mixedcontenterror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Mixedcontenterror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_mixedcontenterror4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_mixedcontenterror4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_mixedcontenterror4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_mixedcontenterror4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_mixedcontenterror4 as "developerPortal.dashboards.tabs.appConfig.mixedContentError" }