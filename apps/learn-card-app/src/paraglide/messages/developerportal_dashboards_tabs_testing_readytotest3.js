/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Readytotest3Inputs */

const en_developerportal_dashboards_tabs_testing_readytotest3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Readytotest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to test`)
};

const es_developerportal_dashboards_tabs_testing_readytotest3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Readytotest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lista para probar`)
};

const fr_developerportal_dashboards_tabs_testing_readytotest3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Readytotest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt à tester`)
};

const ar_developerportal_dashboards_tabs_testing_readytotest3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Readytotest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاهز للاختبار`)
};

/**
* | output |
* | --- |
* | "Ready to test" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Readytotest3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_readytotest3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Readytotest3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Readytotest3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_readytotest3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_readytotest3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_readytotest3(inputs)
	return ar_developerportal_dashboards_tabs_testing_readytotest3(inputs)
});
export { developerportal_dashboards_tabs_testing_readytotest3 as "developerPortal.dashboards.tabs.testing.readyToTest" }