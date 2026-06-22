/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Credential1Inputs */

const en_developerportal_dashboards_activity_credential1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Credential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential`)
};

const es_developerportal_dashboards_activity_credential1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Credential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial`)
};

const fr_developerportal_dashboards_activity_credential1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Credential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificat`)
};

const ar_developerportal_dashboards_activity_credential1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Credential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شهادة`)
};

/**
* | output |
* | --- |
* | "Credential" |
*
* @param {Developerportal_Dashboards_Activity_Credential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_credential1 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Credential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Credential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_credential1(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_credential1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_credential1(inputs)
	return ar_developerportal_dashboards_activity_credential1(inputs)
});
export { developerportal_dashboards_activity_credential1 as "developerPortal.dashboards.activity.credential" }