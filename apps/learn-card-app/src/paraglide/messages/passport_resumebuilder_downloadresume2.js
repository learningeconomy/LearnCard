/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Downloadresume2Inputs */

const en_passport_resumebuilder_downloadresume2 = /** @type {(inputs: Passport_Resumebuilder_Downloadresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download Resume`)
};

const es_passport_resumebuilder_downloadresume2 = /** @type {(inputs: Passport_Resumebuilder_Downloadresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar currículum`)
};

const fr_passport_resumebuilder_downloadresume2 = /** @type {(inputs: Passport_Resumebuilder_Downloadresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le CV`)
};

const ar_passport_resumebuilder_downloadresume2 = /** @type {(inputs: Passport_Resumebuilder_Downloadresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل السيرة الذاتية`)
};

/**
* | output |
* | --- |
* | "Download Resume" |
*
* @param {Passport_Resumebuilder_Downloadresume2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_downloadresume2 = /** @type {((inputs?: Passport_Resumebuilder_Downloadresume2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Downloadresume2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_downloadresume2(inputs)
	if (locale === "es") return es_passport_resumebuilder_downloadresume2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_downloadresume2(inputs)
	return ar_passport_resumebuilder_downloadresume2(inputs)
});
export { passport_resumebuilder_downloadresume2 as "passport.resumeBuilder.downloadResume" }