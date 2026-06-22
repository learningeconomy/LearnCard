/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Testrecipient2Inputs */

const en_developerportal_dashboards_tabs_testing_testrecipient2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testrecipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Recipient`)
};

const es_developerportal_dashboards_tabs_testing_testrecipient2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testrecipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinatario de Prueba`)
};

const fr_developerportal_dashboards_tabs_testing_testrecipient2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testrecipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinataire de Test`)
};

const ar_developerportal_dashboards_tabs_testing_testrecipient2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testrecipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستلم الاختبار`)
};

/**
* | output |
* | --- |
* | "Test Recipient" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Testrecipient2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_testrecipient2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Testrecipient2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Testrecipient2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_testrecipient2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_testrecipient2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_testrecipient2(inputs)
	return ar_developerportal_dashboards_tabs_testing_testrecipient2(inputs)
});
export { developerportal_dashboards_tabs_testing_testrecipient2 as "developerPortal.dashboards.tabs.testing.testRecipient" }