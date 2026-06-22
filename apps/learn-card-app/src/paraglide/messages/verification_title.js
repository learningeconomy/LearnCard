/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_TitleInputs */

const en_verification_title = /** @type {(inputs: Verification_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Verifications`)
};

const es_verification_title = /** @type {(inputs: Verification_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificaciones de credenciales`)
};

const fr_verification_title = /** @type {(inputs: Verification_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifications des identifiants`)
};

const ar_verification_title = /** @type {(inputs: Verification_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من الاعتمادات`)
};

/**
* | output |
* | --- |
* | "Credential Verifications" |
*
* @param {Verification_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_title = /** @type {((inputs?: Verification_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_title(inputs)
	if (locale === "es") return es_verification_title(inputs)
	if (locale === "fr") return fr_verification_title(inputs)
	return ar_verification_title(inputs)
});
export { verification_title as "verification.title" }