/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Revoketokentitle4Inputs */

const en_developerportal_dashboards_tabs_apitokens_revoketokentitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Revoketokentitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoke token`)
};

const es_developerportal_dashboards_tabs_apitokens_revoketokentitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Revoketokentitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocar token`)
};

const fr_developerportal_dashboards_tabs_apitokens_revoketokentitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Revoketokentitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoquer le jeton`)
};

const ar_developerportal_dashboards_tabs_apitokens_revoketokentitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Revoketokentitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء الرمز`)
};

/**
* | output |
* | --- |
* | "Revoke token" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Revoketokentitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_revoketokentitle4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Revoketokentitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Revoketokentitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_revoketokentitle4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_revoketokentitle4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_revoketokentitle4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_revoketokentitle4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_revoketokentitle4 as "developerPortal.dashboards.tabs.apiTokens.revokeTokenTitle" }