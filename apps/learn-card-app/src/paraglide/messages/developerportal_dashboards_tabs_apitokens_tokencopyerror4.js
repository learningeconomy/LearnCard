/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Tokencopyerror4Inputs */

const en_developerportal_dashboards_tabs_apitokens_tokencopyerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencopyerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to copy token`)
};

const es_developerportal_dashboards_tabs_apitokens_tokencopyerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencopyerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al copiar el token`)
};

const fr_developerportal_dashboards_tabs_apitokens_tokencopyerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencopyerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la copie du jeton`)
};

const ar_developerportal_dashboards_tabs_apitokens_tokencopyerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencopyerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل نسخ الرمز`)
};

/**
* | output |
* | --- |
* | "Failed to copy token" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Tokencopyerror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_tokencopyerror4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Tokencopyerror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Tokencopyerror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_tokencopyerror4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_tokencopyerror4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_tokencopyerror4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_tokencopyerror4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_tokencopyerror4 as "developerPortal.dashboards.tabs.apiTokens.tokenCopyError" }