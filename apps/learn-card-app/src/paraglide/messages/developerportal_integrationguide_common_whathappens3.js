/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Whathappens3Inputs */

const en_developerportal_integrationguide_common_whathappens3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Whathappens3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What happens`)
};

const es_developerportal_integrationguide_common_whathappens3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Whathappens3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qué sucede`)
};

const fr_developerportal_integrationguide_common_whathappens3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Whathappens3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce qui se passe`)
};

const ar_developerportal_integrationguide_common_whathappens3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Whathappens3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما يحدث`)
};

/**
* | output |
* | --- |
* | "What happens" |
*
* @param {Developerportal_Integrationguide_Common_Whathappens3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_whathappens3 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Whathappens3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Whathappens3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_whathappens3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_whathappens3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_whathappens3(inputs)
	return ar_developerportal_integrationguide_common_whathappens3(inputs)
});
export { developerportal_integrationguide_common_whathappens3 as "developerPortal.integrationGuide.common.whatHappens" }