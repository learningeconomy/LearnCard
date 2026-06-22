/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Permissions2Inputs */

const en_developerportal_dashboards_tabs_apitokens_permissions2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Permissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permissions`)
};

const es_developerportal_dashboards_tabs_apitokens_permissions2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Permissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos`)
};

const fr_developerportal_dashboards_tabs_apitokens_permissions2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Permissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permissions`)
};

const ar_developerportal_dashboards_tabs_apitokens_permissions2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Permissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأذونات`)
};

/**
* | output |
* | --- |
* | "Permissions" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Permissions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_permissions2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Permissions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Permissions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_permissions2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_permissions2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_permissions2(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_permissions2(inputs)
});
export { developerportal_dashboards_tabs_apitokens_permissions2 as "developerPortal.dashboards.tabs.apiTokens.permissions" }