/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Testingtips2Inputs */

const en_developerportal_dashboards_tabs_testing_testingtips2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testingtips2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Testing Tips`)
};

const es_developerportal_dashboards_tabs_testing_testingtips2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testingtips2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consejos de Prueba`)
};

const fr_developerportal_dashboards_tabs_testing_testingtips2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testingtips2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conseils de Test`)
};

const ar_developerportal_dashboards_tabs_testing_testingtips2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testingtips2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نصائح الاختبار`)
};

/**
* | output |
* | --- |
* | "Testing Tips" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Testingtips2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_testingtips2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Testingtips2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Testingtips2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_testingtips2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_testingtips2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_testingtips2(inputs)
	return ar_developerportal_dashboards_tabs_testing_testingtips2(inputs)
});
export { developerportal_dashboards_tabs_testing_testingtips2 as "developerPortal.dashboards.tabs.testing.testingTips" }