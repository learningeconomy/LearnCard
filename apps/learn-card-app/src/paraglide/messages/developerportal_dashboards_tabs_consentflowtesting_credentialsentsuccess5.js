/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentsuccess5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentsuccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test credential sent!`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentsuccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial de prueba enviada!`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentsuccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential de test envoyé !`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentsuccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال بيانات الاعتماد الاختبارية!`)
};

/**
* | output |
* | --- |
* | "Test credential sent!" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentsuccess5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentsuccess5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentsuccess5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_credentialsentsuccess5 as "developerPortal.dashboards.tabs.consentFlowTesting.credentialSentSuccess" }