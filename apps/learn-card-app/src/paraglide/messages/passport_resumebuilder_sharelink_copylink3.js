/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sharelink_Copylink3Inputs */

const en_passport_resumebuilder_sharelink_copylink3 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Copylink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy Link`)
};

const es_passport_resumebuilder_sharelink_copylink3 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Copylink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar enlace`)
};

const fr_passport_resumebuilder_sharelink_copylink3 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Copylink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le lien`)
};

const ar_passport_resumebuilder_sharelink_copylink3 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Copylink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الرابط`)
};

/**
* | output |
* | --- |
* | "Copy Link" |
*
* @param {Passport_Resumebuilder_Sharelink_Copylink3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sharelink_copylink3 = /** @type {((inputs?: Passport_Resumebuilder_Sharelink_Copylink3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sharelink_Copylink3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sharelink_copylink3(inputs)
	if (locale === "es") return es_passport_resumebuilder_sharelink_copylink3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sharelink_copylink3(inputs)
	return ar_passport_resumebuilder_sharelink_copylink3(inputs)
});
export { passport_resumebuilder_sharelink_copylink3 as "passport.resumeBuilder.shareLink.copyLink" }