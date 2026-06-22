/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Features_Requestcredentials3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Requestcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Credentials`)
};

const es_developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Requestcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Credenciales`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Requestcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander des Justificatifs`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Requestcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب المؤهلات`)
};

/**
* | output |
* | --- |
* | "Request Credentials" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Features_Requestcredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Requestcredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Features_Requestcredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_features_requestcredentials3 as "developerPortal.dashboards.tabs.partnerConnect.features.requestCredentials" }