/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Selfattest_Descriptionplaceholder3Inputs */

const en_passport_resumebuilder_selfattest_descriptionplaceholder3 = /** @type {(inputs: Passport_Resumebuilder_Selfattest_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description...`)
};

const es_passport_resumebuilder_selfattest_descriptionplaceholder3 = /** @type {(inputs: Passport_Resumebuilder_Selfattest_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción...`)
};

const fr_passport_resumebuilder_selfattest_descriptionplaceholder3 = /** @type {(inputs: Passport_Resumebuilder_Selfattest_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description...`)
};

const ar_passport_resumebuilder_selfattest_descriptionplaceholder3 = /** @type {(inputs: Passport_Resumebuilder_Selfattest_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوصف...`)
};

/**
* | output |
* | --- |
* | "Description..." |
*
* @param {Passport_Resumebuilder_Selfattest_Descriptionplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_selfattest_descriptionplaceholder3 = /** @type {((inputs?: Passport_Resumebuilder_Selfattest_Descriptionplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Selfattest_Descriptionplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_selfattest_descriptionplaceholder3(inputs)
	if (locale === "es") return es_passport_resumebuilder_selfattest_descriptionplaceholder3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_selfattest_descriptionplaceholder3(inputs)
	return ar_passport_resumebuilder_selfattest_descriptionplaceholder3(inputs)
});
export { passport_resumebuilder_selfattest_descriptionplaceholder3 as "passport.resumeBuilder.selfAttest.descriptionPlaceholder" }