/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Source_Credentialsend2Inputs */

const en_developerportal_dashboards_activity_source_credentialsend2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Credentialsend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Send`)
};

const es_developerportal_dashboards_activity_source_credentialsend2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Credentialsend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envío de Credencial`)
};

const fr_developerportal_dashboards_activity_source_credentialsend2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Credentialsend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi de Certificat`)
};

const ar_developerportal_dashboards_activity_source_credentialsend2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Credentialsend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال شهادة`)
};

/**
* | output |
* | --- |
* | "Credential Send" |
*
* @param {Developerportal_Dashboards_Activity_Source_Credentialsend2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_source_credentialsend2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Source_Credentialsend2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Source_Credentialsend2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_source_credentialsend2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_source_credentialsend2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_source_credentialsend2(inputs)
	return ar_developerportal_dashboards_activity_source_credentialsend2(inputs)
});
export { developerportal_dashboards_activity_source_credentialsend2 as "developerPortal.dashboards.activity.source.credentialSend" }