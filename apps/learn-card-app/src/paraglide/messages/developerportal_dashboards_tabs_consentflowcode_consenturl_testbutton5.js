/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Testbutton5Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Testbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Consent Flow`)
};

const es_developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Testbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Probar Flujo de Consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Testbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tester le Flux de Consentement`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Testbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Test Consent Flow" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Testbutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Testbutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Testbutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_consenturl_testbutton5 as "developerPortal.dashboards.tabs.consentFlowCode.consentUrl.testButton" }