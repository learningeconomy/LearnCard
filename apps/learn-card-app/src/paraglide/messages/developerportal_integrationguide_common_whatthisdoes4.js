/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Whatthisdoes4Inputs */

const en_developerportal_integrationguide_common_whatthisdoes4 = /** @type {(inputs: Developerportal_Integrationguide_Common_Whatthisdoes4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What this does`)
};

const es_developerportal_integrationguide_common_whatthisdoes4 = /** @type {(inputs: Developerportal_Integrationguide_Common_Whatthisdoes4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qué hace esto`)
};

const fr_developerportal_integrationguide_common_whatthisdoes4 = /** @type {(inputs: Developerportal_Integrationguide_Common_Whatthisdoes4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce que cela fait`)
};

const ar_developerportal_integrationguide_common_whatthisdoes4 = /** @type {(inputs: Developerportal_Integrationguide_Common_Whatthisdoes4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما يفعله هذا`)
};

/**
* | output |
* | --- |
* | "What this does" |
*
* @param {Developerportal_Integrationguide_Common_Whatthisdoes4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_whatthisdoes4 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Whatthisdoes4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Whatthisdoes4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_whatthisdoes4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_whatthisdoes4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_whatthisdoes4(inputs)
	return ar_developerportal_integrationguide_common_whatthisdoes4(inputs)
});
export { developerportal_integrationguide_common_whatthisdoes4 as "developerPortal.integrationGuide.common.whatThisDoes" }