/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Toasttitle_Saved2Inputs */

const en_passport_resumebuilder_toasttitle_saved2 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Saved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saved`)
};

const es_passport_resumebuilder_toasttitle_saved2 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Saved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardado`)
};

const fr_passport_resumebuilder_toasttitle_saved2 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Saved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistré`)
};

const ar_passport_resumebuilder_toasttitle_saved2 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Saved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الحفظ`)
};

/**
* | output |
* | --- |
* | "Saved" |
*
* @param {Passport_Resumebuilder_Toasttitle_Saved2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_toasttitle_saved2 = /** @type {((inputs?: Passport_Resumebuilder_Toasttitle_Saved2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Toasttitle_Saved2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_toasttitle_saved2(inputs)
	if (locale === "es") return es_passport_resumebuilder_toasttitle_saved2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_toasttitle_saved2(inputs)
	return ar_passport_resumebuilder_toasttitle_saved2(inputs)
});
export { passport_resumebuilder_toasttitle_saved2 as "passport.resumeBuilder.toastTitle.saved" }