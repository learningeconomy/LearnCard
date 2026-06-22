/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Fullaccess3Inputs */

const en_developerportal_dashboards_tabs_apitokens_fullaccess3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Fullaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Access`)
};

const es_developerportal_dashboards_tabs_apitokens_fullaccess3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Fullaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso Completo`)
};

const fr_developerportal_dashboards_tabs_apitokens_fullaccess3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Fullaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès Complet`)
};

const ar_developerportal_dashboards_tabs_apitokens_fullaccess3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Fullaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول كامل`)
};

/**
* | output |
* | --- |
* | "Full Access" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Fullaccess3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_fullaccess3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Fullaccess3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Fullaccess3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_fullaccess3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_fullaccess3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_fullaccess3(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_fullaccess3(inputs)
});
export { developerportal_dashboards_tabs_apitokens_fullaccess3 as "developerPortal.dashboards.tabs.apiTokens.fullAccess" }