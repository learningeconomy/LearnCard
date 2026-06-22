/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Unsaved1Inputs */

const en_developerportal_dashboards_tabs_testing_unsaved1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Unsaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unsaved`)
};

const es_developerportal_dashboards_tabs_testing_unsaved1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Unsaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin guardar`)
};

const fr_developerportal_dashboards_tabs_testing_unsaved1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Unsaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non sauvegardé`)
};

const ar_developerportal_dashboards_tabs_testing_unsaved1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Unsaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير محفوظ`)
};

/**
* | output |
* | --- |
* | "Unsaved" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Unsaved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_unsaved1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Unsaved1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Unsaved1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_unsaved1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_unsaved1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_unsaved1(inputs)
	return ar_developerportal_dashboards_tabs_testing_unsaved1(inputs)
});
export { developerportal_dashboards_tabs_testing_unsaved1 as "developerPortal.dashboards.tabs.testing.unsaved" }