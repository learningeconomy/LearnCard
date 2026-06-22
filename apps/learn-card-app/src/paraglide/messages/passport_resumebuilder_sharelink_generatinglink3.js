/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sharelink_Generatinglink3Inputs */

const en_passport_resumebuilder_sharelink_generatinglink3 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Generatinglink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating link...`)
};

const es_passport_resumebuilder_sharelink_generatinglink3 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Generatinglink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando enlace...`)
};

const fr_passport_resumebuilder_sharelink_generatinglink3 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Generatinglink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération du lien...`)
};

const ar_passport_resumebuilder_sharelink_generatinglink3 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Generatinglink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إنشاء الرابط...`)
};

/**
* | output |
* | --- |
* | "Generating link..." |
*
* @param {Passport_Resumebuilder_Sharelink_Generatinglink3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sharelink_generatinglink3 = /** @type {((inputs?: Passport_Resumebuilder_Sharelink_Generatinglink3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sharelink_Generatinglink3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sharelink_generatinglink3(inputs)
	if (locale === "es") return es_passport_resumebuilder_sharelink_generatinglink3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sharelink_generatinglink3(inputs)
	return ar_passport_resumebuilder_sharelink_generatinglink3(inputs)
});
export { passport_resumebuilder_sharelink_generatinglink3 as "passport.resumeBuilder.shareLink.generatingLink" }