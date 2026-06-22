/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentialafterconsent6Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentialafterconsent6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send a credential after consent`)
};

const es_developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentialafterconsent6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar una credencial después del consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentialafterconsent6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer un justificatif après consentement`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentialafterconsent6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال مؤهل بعد الموافقة`)
};

/**
* | output |
* | --- |
* | "Send a credential after consent" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentialafterconsent6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentialafterconsent6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentialafterconsent6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_sendcredentialafterconsent6 as "developerPortal.dashboards.tabs.consentFlowCode.sendCredentialAfterConsent" }