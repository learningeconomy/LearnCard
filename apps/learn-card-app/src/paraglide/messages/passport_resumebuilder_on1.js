/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_On1Inputs */

const en_passport_resumebuilder_on1 = /** @type {(inputs: Passport_Resumebuilder_On1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On`)
};

const es_passport_resumebuilder_on1 = /** @type {(inputs: Passport_Resumebuilder_On1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activado`)
};

const fr_passport_resumebuilder_on1 = /** @type {(inputs: Passport_Resumebuilder_On1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activé`)
};

const ar_passport_resumebuilder_on1 = /** @type {(inputs: Passport_Resumebuilder_On1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مُفعّل`)
};

/**
* | output |
* | --- |
* | "On" |
*
* @param {Passport_Resumebuilder_On1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_on1 = /** @type {((inputs?: Passport_Resumebuilder_On1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_On1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_on1(inputs)
	if (locale === "es") return es_passport_resumebuilder_on1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_on1(inputs)
	return ar_passport_resumebuilder_on1(inputs)
});
export { passport_resumebuilder_on1 as "passport.resumeBuilder.on" }