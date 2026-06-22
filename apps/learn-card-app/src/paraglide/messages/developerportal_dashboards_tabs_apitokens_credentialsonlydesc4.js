/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Credentialsonlydesc4Inputs */

const en_developerportal_dashboards_tabs_apitokens_credentialsonlydesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Credentialsonlydesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue and manage credentials`)
};

const es_developerportal_dashboards_tabs_apitokens_credentialsonlydesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Credentialsonlydesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir y gestionar credenciales`)
};

const fr_developerportal_dashboards_tabs_apitokens_credentialsonlydesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Credentialsonlydesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre et gérer des credentials`)
};

const ar_developerportal_dashboards_tabs_apitokens_credentialsonlydesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Credentialsonlydesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار وإدارة بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Issue and manage credentials" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Credentialsonlydesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_credentialsonlydesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Credentialsonlydesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Credentialsonlydesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_credentialsonlydesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_credentialsonlydesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_credentialsonlydesc4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_credentialsonlydesc4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_credentialsonlydesc4 as "developerPortal.dashboards.tabs.apiTokens.credentialsOnlyDesc" }