/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Method2Inputs */

const en_developerportal_integrationguide_common_method2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Method2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Method`)
};

const es_developerportal_integrationguide_common_method2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Method2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Método`)
};

const fr_developerportal_integrationguide_common_method2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Method2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Méthode`)
};

const ar_developerportal_integrationguide_common_method2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Method2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الطريقة`)
};

/**
* | output |
* | --- |
* | "Method" |
*
* @param {Developerportal_Integrationguide_Common_Method2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_method2 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Method2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Method2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_method2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_method2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_method2(inputs)
	return ar_developerportal_integrationguide_common_method2(inputs)
});
export { developerportal_integrationguide_common_method2 as "developerPortal.integrationGuide.common.method" }