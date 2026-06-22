/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Manageapitokens3Inputs */

const en_developerportal_dashboards_tabs_overview_manageapitokens3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Manageapitokens3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage API Tokens`)
};

const es_developerportal_dashboards_tabs_overview_manageapitokens3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Manageapitokens3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar Tokens de API`)
};

const fr_developerportal_dashboards_tabs_overview_manageapitokens3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Manageapitokens3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les Jetons API`)
};

const ar_developerportal_dashboards_tabs_overview_manageapitokens3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Manageapitokens3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة رموز API`)
};

/**
* | output |
* | --- |
* | "Manage API Tokens" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Manageapitokens3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_manageapitokens3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Manageapitokens3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Manageapitokens3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_manageapitokens3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_manageapitokens3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_manageapitokens3(inputs)
	return ar_developerportal_dashboards_tabs_overview_manageapitokens3(inputs)
});
export { developerportal_dashboards_tabs_overview_manageapitokens3 as "developerPortal.dashboards.tabs.overview.manageApiTokens" }