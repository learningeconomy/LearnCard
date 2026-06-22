/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Sendtestcredential5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendtestcredential5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test Credential`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendtestcredential5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Credencial de Prueba`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendtestcredential5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer un Credential de Test`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendtestcredential5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال بيانات اعتماد اختبارية`)
};

/**
* | output |
* | --- |
* | "Send Test Credential" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Sendtestcredential5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendtestcredential5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Sendtestcredential5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_sendtestcredential5 as "developerPortal.dashboards.tabs.consentFlowTesting.sendTestCredential" }