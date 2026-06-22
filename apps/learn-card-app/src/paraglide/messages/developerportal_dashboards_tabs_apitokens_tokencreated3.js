/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Tokencreated3Inputs */

const en_developerportal_dashboards_tabs_apitokens_tokencreated3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Token created!`)
};

const es_developerportal_dashboards_tabs_apitokens_tokencreated3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Token de API creado!`)
};

const fr_developerportal_dashboards_tabs_apitokens_tokencreated3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jeton API créé !`)
};

const ar_developerportal_dashboards_tabs_apitokens_tokencreated3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء رمز API!`)
};

/**
* | output |
* | --- |
* | "API Token created!" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Tokencreated3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_tokencreated3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Tokencreated3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Tokencreated3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_tokencreated3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_tokencreated3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_tokencreated3(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_tokencreated3(inputs)
});
export { developerportal_dashboards_tabs_apitokens_tokencreated3 as "developerPortal.dashboards.tabs.apiTokens.tokenCreated" }