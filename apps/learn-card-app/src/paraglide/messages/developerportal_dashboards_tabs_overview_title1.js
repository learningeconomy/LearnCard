/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Title1Inputs */

const en_developerportal_dashboards_tabs_overview_title1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quick Actions`)
};

const es_developerportal_dashboards_tabs_overview_title1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acciones Rápidas`)
};

const fr_developerportal_dashboards_tabs_overview_title1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions Rapides`)
};

const ar_developerportal_dashboards_tabs_overview_title1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إجراءات سريعة`)
};

/**
* | output |
* | --- |
* | "Quick Actions" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_title1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_title1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_title1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_title1(inputs)
	return ar_developerportal_dashboards_tabs_overview_title1(inputs)
});
export { developerportal_dashboards_tabs_overview_title1 as "developerPortal.dashboards.tabs.overview.title" }