/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Returns2Inputs */

const en_developerportal_integrationguide_common_returns2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Returns2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Returns`)
};

const es_developerportal_integrationguide_common_returns2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Returns2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Devuelve`)
};

const fr_developerportal_integrationguide_common_returns2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Returns2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retourne`)
};

const ar_developerportal_integrationguide_common_returns2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Returns2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإرجاع`)
};

/**
* | output |
* | --- |
* | "Returns" |
*
* @param {Developerportal_Integrationguide_Common_Returns2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_returns2 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Returns2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Returns2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_returns2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_returns2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_returns2(inputs)
	return ar_developerportal_integrationguide_common_returns2(inputs)
});
export { developerportal_integrationguide_common_returns2 as "developerPortal.integrationGuide.common.returns" }