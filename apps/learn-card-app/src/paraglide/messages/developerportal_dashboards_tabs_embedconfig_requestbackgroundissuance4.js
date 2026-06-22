/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuance4Inputs */

const en_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Background Issuance Consent`)
};

const es_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Consentimiento de Emisión en Segundo Plano`)
};

const fr_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander le Consentement d'Émission en Arrière-plan`)
};

const ar_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب موافقة الإصدار في الخلفية`)
};

/**
* | output |
* | --- |
* | "Request Background Issuance Consent" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuance4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuance4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuance4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_requestbackgroundissuance4 as "developerPortal.dashboards.tabs.embedConfig.requestBackgroundIssuance" }