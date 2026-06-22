/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Securitywarning3Inputs */

const en_developerportal_dashboards_tabs_apitokens_securitywarning3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Securitywarning3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Security`)
};

const es_developerportal_dashboards_tabs_apitokens_securitywarning3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Securitywarning3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguridad`)
};

const fr_developerportal_dashboards_tabs_apitokens_securitywarning3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Securitywarning3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sécurité`)
};

const ar_developerportal_dashboards_tabs_apitokens_securitywarning3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Securitywarning3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأمان`)
};

/**
* | output |
* | --- |
* | "Security" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Securitywarning3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_securitywarning3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Securitywarning3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Securitywarning3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_securitywarning3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_securitywarning3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_securitywarning3(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_securitywarning3(inputs)
});
export { developerportal_dashboards_tabs_apitokens_securitywarning3 as "developerPortal.dashboards.tabs.apiTokens.securityWarning" }