/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ type: NonNullable<unknown> }} Passport_Resumebuilder_Selfattest_Addtitle3Inputs */

const en_passport_resumebuilder_selfattest_addtitle3 = /** @type {(inputs: Passport_Resumebuilder_Selfattest_Addtitle3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Add ${i?.type}`)
};

const es_passport_resumebuilder_selfattest_addtitle3 = /** @type {(inputs: Passport_Resumebuilder_Selfattest_Addtitle3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Añadir ${i?.type}`)
};

const fr_passport_resumebuilder_selfattest_addtitle3 = /** @type {(inputs: Passport_Resumebuilder_Selfattest_Addtitle3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ajouter ${i?.type}`)
};

const ar_passport_resumebuilder_selfattest_addtitle3 = /** @type {(inputs: Passport_Resumebuilder_Selfattest_Addtitle3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إضافة ${i?.type}`)
};

/**
* | output |
* | --- |
* | "Add {type}" |
*
* @param {Passport_Resumebuilder_Selfattest_Addtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_selfattest_addtitle3 = /** @type {((inputs: Passport_Resumebuilder_Selfattest_Addtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Selfattest_Addtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_selfattest_addtitle3(inputs)
	if (locale === "es") return es_passport_resumebuilder_selfattest_addtitle3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_selfattest_addtitle3(inputs)
	return ar_passport_resumebuilder_selfattest_addtitle3(inputs)
});
export { passport_resumebuilder_selfattest_addtitle3 as "passport.resumeBuilder.selfAttest.addTitle" }