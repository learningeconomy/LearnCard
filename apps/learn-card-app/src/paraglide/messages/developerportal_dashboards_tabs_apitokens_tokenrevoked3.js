/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Tokenrevoked3Inputs */

const en_developerportal_dashboards_tabs_apitokens_tokenrevoked3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevoked3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token revoked`)
};

const es_developerportal_dashboards_tabs_apitokens_tokenrevoked3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevoked3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token revocado`)
};

const fr_developerportal_dashboards_tabs_apitokens_tokenrevoked3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevoked3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jeton révoqué`)
};

const ar_developerportal_dashboards_tabs_apitokens_tokenrevoked3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevoked3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إلغاء الرمز`)
};

/**
* | output |
* | --- |
* | "Token revoked" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Tokenrevoked3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_tokenrevoked3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevoked3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Tokenrevoked3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_tokenrevoked3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_tokenrevoked3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_tokenrevoked3(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_tokenrevoked3(inputs)
});
export { developerportal_dashboards_tabs_apitokens_tokenrevoked3 as "developerPortal.dashboards.tabs.apiTokens.tokenRevoked" }