/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_TitleInputs */

const en_sdk_verification_title = /** @type {(inputs: Sdk_Verification_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Verifications`)
};

const es_sdk_verification_title = /** @type {(inputs: Sdk_Verification_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificaciones de credenciales`)
};

const fr_sdk_verification_title = /** @type {(inputs: Sdk_Verification_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifications du justificatif`)
};

const ar_sdk_verification_title = /** @type {(inputs: Sdk_Verification_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عمليات التحقق من بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential Verifications" |
*
* @param {Sdk_Verification_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_title = /** @type {((inputs?: Sdk_Verification_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_title(inputs)
	if (locale === "es") return es_sdk_verification_title(inputs)
	if (locale === "fr") return fr_sdk_verification_title(inputs)
	return ar_sdk_verification_title(inputs)
});
export { sdk_verification_title as "sdk.verification.title" }