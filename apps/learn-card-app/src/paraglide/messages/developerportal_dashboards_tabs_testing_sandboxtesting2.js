/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Sandboxtesting2Inputs */

const en_developerportal_dashboards_tabs_testing_sandboxtesting2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sandboxtesting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sandbox Testing`)
};

const es_developerportal_dashboards_tabs_testing_sandboxtesting2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sandboxtesting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pruebas en Sandbox`)
};

const fr_developerportal_dashboards_tabs_testing_sandboxtesting2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sandboxtesting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tests en Sandbox`)
};

const ar_developerportal_dashboards_tabs_testing_sandboxtesting2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sandboxtesting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاختبار في بيئة تجريبية`)
};

/**
* | output |
* | --- |
* | "Sandbox Testing" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Sandboxtesting2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_sandboxtesting2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Sandboxtesting2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Sandboxtesting2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_sandboxtesting2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_sandboxtesting2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_sandboxtesting2(inputs)
	return ar_developerportal_dashboards_tabs_testing_sandboxtesting2(inputs)
});
export { developerportal_dashboards_tabs_testing_sandboxtesting2 as "developerPortal.dashboards.tabs.testing.sandboxTesting" }