/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Fullaccessdesc4Inputs */

const en_developerportal_dashboards_tabs_apitokens_fullaccessdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Fullaccessdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete access to all resources`)
};

const es_developerportal_dashboards_tabs_apitokens_fullaccessdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Fullaccessdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso completo a todos los recursos`)
};

const fr_developerportal_dashboards_tabs_apitokens_fullaccessdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Fullaccessdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès complet à toutes les ressources`)
};

const ar_developerportal_dashboards_tabs_apitokens_fullaccessdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Fullaccessdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول كامل لجميع الموارد`)
};

/**
* | output |
* | --- |
* | "Complete access to all resources" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Fullaccessdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_fullaccessdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Fullaccessdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Fullaccessdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_fullaccessdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_fullaccessdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_fullaccessdesc4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_fullaccessdesc4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_fullaccessdesc4 as "developerPortal.dashboards.tabs.apiTokens.fullAccessDesc" }