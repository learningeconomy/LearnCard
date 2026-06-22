/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Managecontracts2Inputs */

const en_developerportal_dashboards_tabs_overview_managecontracts2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Managecontracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Contracts`)
};

const es_developerportal_dashboards_tabs_overview_managecontracts2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Managecontracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar Contratos`)
};

const fr_developerportal_dashboards_tabs_overview_managecontracts2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Managecontracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les Contrats`)
};

const ar_developerportal_dashboards_tabs_overview_managecontracts2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Managecontracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة العقود`)
};

/**
* | output |
* | --- |
* | "Manage Contracts" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Managecontracts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_managecontracts2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Managecontracts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Managecontracts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_managecontracts2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_managecontracts2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_managecontracts2(inputs)
	return ar_developerportal_dashboards_tabs_overview_managecontracts2(inputs)
});
export { developerportal_dashboards_tabs_overview_managecontracts2 as "developerPortal.dashboards.tabs.overview.manageContracts" }