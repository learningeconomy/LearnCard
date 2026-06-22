/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Nolistingstitle4Inputs */

const en_developerportal_dashboards_tabs_appconfig_nolistingstitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Nolistingstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No app listings found`)
};

const es_developerportal_dashboards_tabs_appconfig_nolistingstitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Nolistingstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron listados de aplicaciones`)
};

const fr_developerportal_dashboards_tabs_appconfig_nolistingstitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Nolistingstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune liste d'application trouvée`)
};

const ar_developerportal_dashboards_tabs_appconfig_nolistingstitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Nolistingstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على قوائم التطبيقات`)
};

/**
* | output |
* | --- |
* | "No app listings found" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Nolistingstitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_nolistingstitle4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Nolistingstitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Nolistingstitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_nolistingstitle4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_nolistingstitle4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_nolistingstitle4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_nolistingstitle4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_nolistingstitle4 as "developerPortal.dashboards.tabs.appConfig.noListingsTitle" }