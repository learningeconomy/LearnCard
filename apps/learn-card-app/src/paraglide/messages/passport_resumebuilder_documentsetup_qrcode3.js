/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown>, status: NonNullable<unknown> }} Passport_Resumebuilder_Documentsetup_Qrcode3Inputs */

const en_passport_resumebuilder_documentsetup_qrcode3 = /** @type {(inputs: Passport_Resumebuilder_Documentsetup_Qrcode3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand} QR code • ${i?.status}`)
};

const es_passport_resumebuilder_documentsetup_qrcode3 = /** @type {(inputs: Passport_Resumebuilder_Documentsetup_Qrcode3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Código QR de ${i?.brand} • ${i?.status}`)
};

const fr_passport_resumebuilder_documentsetup_qrcode3 = /** @type {(inputs: Passport_Resumebuilder_Documentsetup_Qrcode3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Code QR ${i?.brand} • ${i?.status}`)
};

const ar_passport_resumebuilder_documentsetup_qrcode3 = /** @type {(inputs: Passport_Resumebuilder_Documentsetup_Qrcode3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`رمز QR الخاص بـ ${i?.brand} • ${i?.status}`)
};

/**
* | output |
* | --- |
* | "{brand} QR code • {status}" |
*
* @param {Passport_Resumebuilder_Documentsetup_Qrcode3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_documentsetup_qrcode3 = /** @type {((inputs: Passport_Resumebuilder_Documentsetup_Qrcode3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Documentsetup_Qrcode3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_documentsetup_qrcode3(inputs)
	if (locale === "es") return es_passport_resumebuilder_documentsetup_qrcode3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_documentsetup_qrcode3(inputs)
	return ar_passport_resumebuilder_documentsetup_qrcode3(inputs)
});
export { passport_resumebuilder_documentsetup_qrcode3 as "passport.resumeBuilder.documentSetup.qrCode" }