/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Emptypreview_Title2Inputs */

const en_passport_resumebuilder_emptypreview_title2 = /** @type {(inputs: Passport_Resumebuilder_Emptypreview_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your resume will appear here`)
};

const es_passport_resumebuilder_emptypreview_title2 = /** @type {(inputs: Passport_Resumebuilder_Emptypreview_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu currículum aparecerá aquí`)
};

const fr_passport_resumebuilder_emptypreview_title2 = /** @type {(inputs: Passport_Resumebuilder_Emptypreview_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre CV apparaîtra ici`)
};

const ar_passport_resumebuilder_emptypreview_title2 = /** @type {(inputs: Passport_Resumebuilder_Emptypreview_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستظهر سيرتك الذاتية هنا`)
};

/**
* | output |
* | --- |
* | "Your resume will appear here" |
*
* @param {Passport_Resumebuilder_Emptypreview_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_emptypreview_title2 = /** @type {((inputs?: Passport_Resumebuilder_Emptypreview_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Emptypreview_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_emptypreview_title2(inputs)
	if (locale === "es") return es_passport_resumebuilder_emptypreview_title2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_emptypreview_title2(inputs)
	return ar_passport_resumebuilder_emptypreview_title2(inputs)
});
export { passport_resumebuilder_emptypreview_title2 as "passport.resumeBuilder.emptyPreview.title" }