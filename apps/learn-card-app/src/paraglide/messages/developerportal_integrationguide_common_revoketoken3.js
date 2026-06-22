/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Revoketoken3Inputs */

const en_developerportal_integrationguide_common_revoketoken3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Revoketoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoke token`)
};

const es_developerportal_integrationguide_common_revoketoken3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Revoketoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocar token`)
};

const fr_developerportal_integrationguide_common_revoketoken3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Revoketoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoquer le jeton`)
};

const ar_developerportal_integrationguide_common_revoketoken3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Revoketoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء الرمز`)
};

/**
* | output |
* | --- |
* | "Revoke token" |
*
* @param {Developerportal_Integrationguide_Common_Revoketoken3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_revoketoken3 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Revoketoken3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Revoketoken3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_revoketoken3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_revoketoken3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_revoketoken3(inputs)
	return ar_developerportal_integrationguide_common_revoketoken3(inputs)
});
export { developerportal_integrationguide_common_revoketoken3 as "developerPortal.integrationGuide.common.revokeToken" }