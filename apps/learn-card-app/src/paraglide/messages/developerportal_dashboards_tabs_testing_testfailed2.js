/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Testfailed2Inputs */

const en_developerportal_dashboards_tabs_testing_testfailed2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send test credential`)
};

const es_developerportal_dashboards_tabs_testing_testfailed2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al enviar la credencial de prueba`)
};

const fr_developerportal_dashboards_tabs_testing_testfailed2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'envoi du credential de test`)
};

const ar_developerportal_dashboards_tabs_testing_testfailed2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إرسال بيانات الاعتماد الاختبارية`)
};

/**
* | output |
* | --- |
* | "Failed to send test credential" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Testfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_testfailed2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Testfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Testfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_testfailed2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_testfailed2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_testfailed2(inputs)
	return ar_developerportal_dashboards_tabs_testing_testfailed2(inputs)
});
export { developerportal_dashboards_tabs_testing_testfailed2 as "developerPortal.dashboards.tabs.testing.testFailed" }