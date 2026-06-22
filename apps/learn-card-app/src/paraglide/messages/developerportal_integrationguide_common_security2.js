/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Security2Inputs */

const en_developerportal_integrationguide_common_security2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Security2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Security`)
};

const es_developerportal_integrationguide_common_security2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Security2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguridad`)
};

const fr_developerportal_integrationguide_common_security2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Security2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sécurité`)
};

const ar_developerportal_integrationguide_common_security2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Security2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأمان`)
};

/**
* | output |
* | --- |
* | "Security" |
*
* @param {Developerportal_Integrationguide_Common_Security2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_security2 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Security2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Security2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_security2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_security2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_security2(inputs)
	return ar_developerportal_integrationguide_common_security2(inputs)
});
export { developerportal_integrationguide_common_security2 as "developerPortal.integrationGuide.common.security" }