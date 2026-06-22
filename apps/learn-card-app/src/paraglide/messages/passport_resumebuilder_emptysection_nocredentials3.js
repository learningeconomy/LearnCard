/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Emptysection_Nocredentials3Inputs */

const en_passport_resumebuilder_emptysection_nocredentials3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Nocredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials found`)
};

const es_passport_resumebuilder_emptysection_nocredentials3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Nocredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron credenciales`)
};

const fr_passport_resumebuilder_emptysection_nocredentials3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Nocredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun titre trouvé`)
};

const ar_passport_resumebuilder_emptysection_nocredentials3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Nocredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على شهادات`)
};

/**
* | output |
* | --- |
* | "No credentials found" |
*
* @param {Passport_Resumebuilder_Emptysection_Nocredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_emptysection_nocredentials3 = /** @type {((inputs?: Passport_Resumebuilder_Emptysection_Nocredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Emptysection_Nocredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_emptysection_nocredentials3(inputs)
	if (locale === "es") return es_passport_resumebuilder_emptysection_nocredentials3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_emptysection_nocredentials3(inputs)
	return ar_passport_resumebuilder_emptysection_nocredentials3(inputs)
});
export { passport_resumebuilder_emptysection_nocredentials3 as "passport.resumeBuilder.emptySection.noCredentials" }