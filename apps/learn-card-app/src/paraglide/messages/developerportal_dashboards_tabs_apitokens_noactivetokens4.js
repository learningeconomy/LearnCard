/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Noactivetokens4Inputs */

const en_developerportal_dashboards_tabs_apitokens_noactivetokens4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokens4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No active API tokens`)
};

const es_developerportal_dashboards_tabs_apitokens_noactivetokens4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokens4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay tokens de API activos`)
};

const fr_developerportal_dashboards_tabs_apitokens_noactivetokens4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokens4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun jeton API actif`)
};

const ar_developerportal_dashboards_tabs_apitokens_noactivetokens4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokens4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد رموز API نشطة`)
};

/**
* | output |
* | --- |
* | "No active API tokens" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Noactivetokens4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_noactivetokens4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokens4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Noactivetokens4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_noactivetokens4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_noactivetokens4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_noactivetokens4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_noactivetokens4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_noactivetokens4 as "developerPortal.dashboards.tabs.apiTokens.noActiveTokens" }