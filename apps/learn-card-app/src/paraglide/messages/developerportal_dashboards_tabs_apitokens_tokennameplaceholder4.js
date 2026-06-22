/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Tokennameplaceholder4Inputs */

const en_developerportal_dashboards_tabs_apitokens_tokennameplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokennameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Production Server`)
};

const es_developerportal_dashboards_tabs_apitokens_tokennameplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokennameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Servidor de Producción`)
};

const fr_developerportal_dashboards_tabs_apitokens_tokennameplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokennameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Serveur de Production`)
};

const ar_developerportal_dashboards_tabs_apitokens_tokennameplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokennameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: خادم الإنتاج`)
};

/**
* | output |
* | --- |
* | "e.g., Production Server" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Tokennameplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_tokennameplaceholder4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Tokennameplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Tokennameplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_tokennameplaceholder4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_tokennameplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_tokennameplaceholder4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_tokennameplaceholder4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_tokennameplaceholder4 as "developerPortal.dashboards.tabs.apiTokens.tokenNamePlaceholder" }