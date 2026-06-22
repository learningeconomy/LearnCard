/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Processing3Inputs */

const en_passport_buildmylearncard_processing3 = /** @type {(inputs: Passport_Buildmylearncard_Processing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Processing documents…`)
};

const es_passport_buildmylearncard_processing3 = /** @type {(inputs: Passport_Buildmylearncard_Processing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Procesando documentos…`)
};

const fr_passport_buildmylearncard_processing3 = /** @type {(inputs: Passport_Buildmylearncard_Processing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traitement des documents…`)
};

const ar_passport_buildmylearncard_processing3 = /** @type {(inputs: Passport_Buildmylearncard_Processing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري معالجة المستندات…`)
};

/**
* | output |
* | --- |
* | "Processing documents…" |
*
* @param {Passport_Buildmylearncard_Processing3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_processing3 = /** @type {((inputs?: Passport_Buildmylearncard_Processing3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Processing3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_processing3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_processing3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_processing3(inputs)
	return ar_passport_buildmylearncard_processing3(inputs)
});
export { passport_buildmylearncard_processing3 as "passport.buildMyLearnCard.processing" }