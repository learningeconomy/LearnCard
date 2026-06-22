/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Corserrors3Inputs */

const en_developerportal_dashboards_tabs_appconfig_corserrors3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Corserrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS errors?`)
};

const es_developerportal_dashboards_tabs_appconfig_corserrors3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Corserrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Errores CORS?`)
};

const fr_developerportal_dashboards_tabs_appconfig_corserrors3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Corserrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreurs CORS ?`)
};

const ar_developerportal_dashboards_tabs_appconfig_corserrors3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Corserrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أخطاء CORS؟`)
};

/**
* | output |
* | --- |
* | "CORS errors?" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Corserrors3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_corserrors3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Corserrors3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Corserrors3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_corserrors3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_corserrors3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_corserrors3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_corserrors3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_corserrors3 as "developerPortal.dashboards.tabs.appConfig.corsErrors" }