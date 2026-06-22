/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Learnhowtointegrate4Inputs */

const en_developerportal_dashboards_tabs_overview_learnhowtointegrate4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Learnhowtointegrate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learn how to integrate`)
};

const es_developerportal_dashboards_tabs_overview_learnhowtointegrate4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Learnhowtointegrate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprende cómo integrar`)
};

const fr_developerportal_dashboards_tabs_overview_learnhowtointegrate4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Learnhowtointegrate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apprenez à intégrer`)
};

const ar_developerportal_dashboards_tabs_overview_learnhowtointegrate4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Learnhowtointegrate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعلم كيفية التكامل`)
};

/**
* | output |
* | --- |
* | "Learn how to integrate" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Learnhowtointegrate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_learnhowtointegrate4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Learnhowtointegrate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Learnhowtointegrate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_learnhowtointegrate4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_learnhowtointegrate4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_learnhowtointegrate4(inputs)
	return ar_developerportal_dashboards_tabs_overview_learnhowtointegrate4(inputs)
});
export { developerportal_dashboards_tabs_overview_learnhowtointegrate4 as "developerPortal.dashboards.tabs.overview.learnHowToIntegrate" }