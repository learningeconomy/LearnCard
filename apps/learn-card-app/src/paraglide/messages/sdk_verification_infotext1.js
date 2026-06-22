/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Infotext1Inputs */

const en_sdk_verification_infotext1 = /** @type {(inputs: Sdk_Verification_Infotext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential verifications check the cryptographic proof of digital credentials to ensure their authenticity and accuracy.`)
};

const es_sdk_verification_infotext1 = /** @type {(inputs: Sdk_Verification_Infotext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las verificaciones de credenciales comprueban la prueba criptográfica de las credenciales digitales para garantizar su autenticidad y exactitud.`)
};

const fr_sdk_verification_infotext1 = /** @type {(inputs: Sdk_Verification_Infotext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les vérifications de justificatifs contrôlent la preuve cryptographique des justificatifs numériques pour garantir leur authenticité et leur exactitude.`)
};

const ar_sdk_verification_infotext1 = /** @type {(inputs: Sdk_Verification_Infotext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتحقق عمليات التحقق من بيانات الاعتماد من الإثبات التشفيري لبيانات الاعتماد الرقمية لضمان صحتها ودقتها.`)
};

/**
* | output |
* | --- |
* | "Credential verifications check the cryptographic proof of digital credentials to ensure their authenticity and accuracy." |
*
* @param {Sdk_Verification_Infotext1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_infotext1 = /** @type {((inputs?: Sdk_Verification_Infotext1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Infotext1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_infotext1(inputs)
	if (locale === "es") return es_sdk_verification_infotext1(inputs)
	if (locale === "fr") return fr_sdk_verification_infotext1(inputs)
	return ar_sdk_verification_infotext1(inputs)
});
export { sdk_verification_infotext1 as "sdk.verification.infoText" }