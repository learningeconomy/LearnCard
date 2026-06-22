/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Sendingtest2Inputs */

const en_developerportal_dashboards_tabs_testing_sendingtest2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendingtest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending test credential...`)
};

const es_developerportal_dashboards_tabs_testing_sendingtest2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendingtest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando credencial de prueba...`)
};

const fr_developerportal_dashboards_tabs_testing_sendingtest2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendingtest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi du credential de test...`)
};

const ar_developerportal_dashboards_tabs_testing_sendingtest2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendingtest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إرسال بيانات الاعتماد الاختبارية...`)
};

/**
* | output |
* | --- |
* | "Sending test credential..." |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Sendingtest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_sendingtest2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Sendingtest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Sendingtest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_sendingtest2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_sendingtest2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_sendingtest2(inputs)
	return ar_developerportal_dashboards_tabs_testing_sendingtest2(inputs)
});
export { developerportal_dashboards_tabs_testing_sendingtest2 as "developerPortal.dashboards.tabs.testing.sendingTest" }