/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Toasttitle_Published2Inputs */

const en_passport_resumebuilder_toasttitle_published2 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Published2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Published`)
};

const es_passport_resumebuilder_toasttitle_published2 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Published2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicado`)
};

const fr_passport_resumebuilder_toasttitle_published2 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Published2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publié`)
};

const ar_passport_resumebuilder_toasttitle_published2 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Published2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منشورة`)
};

/**
* | output |
* | --- |
* | "Published" |
*
* @param {Passport_Resumebuilder_Toasttitle_Published2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_toasttitle_published2 = /** @type {((inputs?: Passport_Resumebuilder_Toasttitle_Published2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Toasttitle_Published2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_toasttitle_published2(inputs)
	if (locale === "es") return es_passport_resumebuilder_toasttitle_published2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_toasttitle_published2(inputs)
	return ar_passport_resumebuilder_toasttitle_published2(inputs)
});
export { passport_resumebuilder_toasttitle_published2 as "passport.resumeBuilder.toastTitle.published" }