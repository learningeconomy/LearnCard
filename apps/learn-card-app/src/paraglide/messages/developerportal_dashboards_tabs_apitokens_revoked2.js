/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Revoked2Inputs */

const en_developerportal_dashboards_tabs_apitokens_revoked2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Revoked2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoked`)
};

const es_developerportal_dashboards_tabs_apitokens_revoked2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Revoked2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocado`)
};

const fr_developerportal_dashboards_tabs_apitokens_revoked2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Revoked2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoqué`)
};

const ar_developerportal_dashboards_tabs_apitokens_revoked2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Revoked2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملغى`)
};

/**
* | output |
* | --- |
* | "Revoked" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Revoked2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_revoked2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Revoked2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Revoked2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_revoked2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_revoked2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_revoked2(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_revoked2(inputs)
});
export { developerportal_dashboards_tabs_apitokens_revoked2 as "developerPortal.dashboards.tabs.apiTokens.revoked" }