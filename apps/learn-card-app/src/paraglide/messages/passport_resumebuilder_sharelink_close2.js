/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sharelink_Close2Inputs */

const en_passport_resumebuilder_sharelink_close2 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Close2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close share modal`)
};

const es_passport_resumebuilder_sharelink_close2 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Close2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar ventana de compartir`)
};

const fr_passport_resumebuilder_sharelink_close2 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Close2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer la fenêtre de partage`)
};

const ar_passport_resumebuilder_sharelink_close2 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Close2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق نافذة المشاركة`)
};

/**
* | output |
* | --- |
* | "Close share modal" |
*
* @param {Passport_Resumebuilder_Sharelink_Close2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sharelink_close2 = /** @type {((inputs?: Passport_Resumebuilder_Sharelink_Close2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sharelink_Close2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sharelink_close2(inputs)
	if (locale === "es") return es_passport_resumebuilder_sharelink_close2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sharelink_close2(inputs)
	return ar_passport_resumebuilder_sharelink_close2(inputs)
});
export { passport_resumebuilder_sharelink_close2 as "passport.resumeBuilder.shareLink.close" }