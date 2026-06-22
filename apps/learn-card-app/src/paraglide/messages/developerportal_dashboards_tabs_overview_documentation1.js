/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Documentation1Inputs */

const en_developerportal_dashboards_tabs_overview_documentation1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Documentation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentation`)
};

const es_developerportal_dashboards_tabs_overview_documentation1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Documentation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentación`)
};

const fr_developerportal_dashboards_tabs_overview_documentation1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Documentation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentation`)
};

const ar_developerportal_dashboards_tabs_overview_documentation1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Documentation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوثيق`)
};

/**
* | output |
* | --- |
* | "Documentation" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Documentation1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_documentation1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Documentation1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Documentation1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_documentation1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_documentation1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_documentation1(inputs)
	return ar_developerportal_dashboards_tabs_overview_documentation1(inputs)
});
export { developerportal_dashboards_tabs_overview_documentation1 as "developerPortal.dashboards.tabs.overview.documentation" }