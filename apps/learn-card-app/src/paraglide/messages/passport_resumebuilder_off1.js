/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Off1Inputs */

const en_passport_resumebuilder_off1 = /** @type {(inputs: Passport_Resumebuilder_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Off`)
};

const es_passport_resumebuilder_off1 = /** @type {(inputs: Passport_Resumebuilder_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desactivado`)
};

const fr_passport_resumebuilder_off1 = /** @type {(inputs: Passport_Resumebuilder_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désactivé`)
};

const ar_passport_resumebuilder_off1 = /** @type {(inputs: Passport_Resumebuilder_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مُعطّل`)
};

/**
* | output |
* | --- |
* | "Off" |
*
* @param {Passport_Resumebuilder_Off1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_off1 = /** @type {((inputs?: Passport_Resumebuilder_Off1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Off1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_off1(inputs)
	if (locale === "es") return es_passport_resumebuilder_off1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_off1(inputs)
	return ar_passport_resumebuilder_off1(inputs)
});
export { passport_resumebuilder_off1 as "passport.resumeBuilder.off" }