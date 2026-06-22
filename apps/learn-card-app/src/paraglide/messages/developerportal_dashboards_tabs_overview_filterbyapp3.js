/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Filterbyapp3Inputs */

const en_developerportal_dashboards_tabs_overview_filterbyapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Filterbyapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filter by app listing`)
};

const es_developerportal_dashboards_tabs_overview_filterbyapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Filterbyapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar por listing de app`)
};

const fr_developerportal_dashboards_tabs_overview_filterbyapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Filterbyapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrer par fiche d'application`)
};

const ar_developerportal_dashboards_tabs_overview_filterbyapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Filterbyapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفية حسب قائمة التطبيق`)
};

/**
* | output |
* | --- |
* | "Filter by app listing" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Filterbyapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_filterbyapp3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Filterbyapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Filterbyapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_filterbyapp3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_filterbyapp3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_filterbyapp3(inputs)
	return ar_developerportal_dashboards_tabs_overview_filterbyapp3(inputs)
});
export { developerportal_dashboards_tabs_overview_filterbyapp3 as "developerPortal.dashboards.tabs.overview.filterByApp" }