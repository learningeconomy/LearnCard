/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Tokenrevokeerror4Inputs */

const en_developerportal_dashboards_tabs_apitokens_tokenrevokeerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevokeerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to revoke token`)
};

const es_developerportal_dashboards_tabs_apitokens_tokenrevokeerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevokeerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al revocar el token`)
};

const fr_developerportal_dashboards_tabs_apitokens_tokenrevokeerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevokeerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la révocation du jeton`)
};

const ar_developerportal_dashboards_tabs_apitokens_tokenrevokeerror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevokeerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إلغاء الرمز`)
};

/**
* | output |
* | --- |
* | "Failed to revoke token" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Tokenrevokeerror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_tokenrevokeerror4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Tokenrevokeerror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Tokenrevokeerror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_tokenrevokeerror4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_tokenrevokeerror4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_tokenrevokeerror4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_tokenrevokeerror4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_tokenrevokeerror4 as "developerPortal.dashboards.tabs.apiTokens.tokenRevokeError" }