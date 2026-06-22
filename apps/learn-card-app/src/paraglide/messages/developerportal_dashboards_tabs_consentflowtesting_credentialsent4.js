/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsent4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_credentialsent4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential sent!`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_credentialsent4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial enviada!`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_credentialsent4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential envoyé !`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_credentialsent4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال بيانات الاعتماد!`)
};

/**
* | output |
* | --- |
* | "Credential sent!" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsent4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_credentialsent4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsent4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsent4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_credentialsent4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_credentialsent4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_credentialsent4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_credentialsent4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_credentialsent4 as "developerPortal.dashboards.tabs.consentFlowTesting.credentialSent" }