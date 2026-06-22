/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sharelink_Description12Inputs */

const en_passport_resumebuilder_sharelink_description12 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Description12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This link and QR code let others view your shared resume.`)
};

const es_passport_resumebuilder_sharelink_description12 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Description12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este enlace y el código QR permiten que otros vean tu currículum compartido.`)
};

const fr_passport_resumebuilder_sharelink_description12 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Description12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce lien et ce QR code permettent à d'autres de consulter votre CV partagé.`)
};

const ar_passport_resumebuilder_sharelink_description12 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Description12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتيح هذا الرابط ورمز QR للآخرين عرض سيرتك الذاتية المشتركة.`)
};

/**
* | output |
* | --- |
* | "This link and QR code let others view your shared resume." |
*
* @param {Passport_Resumebuilder_Sharelink_Description12Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sharelink_description12 = /** @type {((inputs?: Passport_Resumebuilder_Sharelink_Description12Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sharelink_Description12Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sharelink_description12(inputs)
	if (locale === "es") return es_passport_resumebuilder_sharelink_description12(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sharelink_description12(inputs)
	return ar_passport_resumebuilder_sharelink_description12(inputs)
});
export { passport_resumebuilder_sharelink_description12 as "passport.resumeBuilder.shareLink.description1" }