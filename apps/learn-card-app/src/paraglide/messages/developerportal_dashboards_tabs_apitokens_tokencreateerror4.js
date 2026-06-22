/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Tokencreateerror4Inputs */

const en_developerportal_dashboards_tabs_apitokens_tokencreateerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to create token`)
};

const es_developerportal_dashboards_tabs_apitokens_tokencreateerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al crear el token`)
};

const fr_developerportal_dashboards_tabs_apitokens_tokencreateerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la création du jeton`)
};

const ar_developerportal_dashboards_tabs_apitokens_tokencreateerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء الرمز`)
};

/**
* | output |
* | --- |
* | "Failed to create token" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Tokencreateerror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_tokencreateerror4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Tokencreateerror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Tokencreateerror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_tokencreateerror4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_tokencreateerror4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_tokencreateerror4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_tokencreateerror4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_tokencreateerror4 as "developerPortal.dashboards.tabs.apiTokens.tokenCreateError" }