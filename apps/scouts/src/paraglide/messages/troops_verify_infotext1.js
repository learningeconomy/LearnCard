/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Verify_Infotext1Inputs */

const en_troops_verify_infotext1 = /** @type {(inputs: Troops_Verify_Infotext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential verifications check the cryptographic proof of digital credentials to ensure their authenticity and accuracy.`)
};

const es_troops_verify_infotext1 = /** @type {(inputs: Troops_Verify_Infotext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las verificaciones de credenciales comprueban la prueba criptográfica de las credenciales digitales para garantizar su autenticidad y precisión.`)
};

const fr_troops_verify_infotext1 = /** @type {(inputs: Troops_Verify_Infotext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les vérifications de justificatif contrôlent la preuve cryptographique des justificatifs numériques pour garantir leur authenticité et leur exactitude.`)
};

const ar_troops_verify_infotext1 = /** @type {(inputs: Troops_Verify_Infotext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من المؤهلات يتحقق من الإثباتات التشفيرية للمؤهلات الرقمية لضمان صحتها ودقتها.`)
};

/**
* | output |
* | --- |
* | "Credential verifications check the cryptographic proof of digital credentials to ensure their authenticity and accuracy." |
*
* @param {Troops_Verify_Infotext1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_verify_infotext1 = /** @type {((inputs?: Troops_Verify_Infotext1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Verify_Infotext1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_verify_infotext1(inputs)
	if (locale === "es") return es_troops_verify_infotext1(inputs)
	if (locale === "fr") return fr_troops_verify_infotext1(inputs)
	return ar_troops_verify_infotext1(inputs)
});
export { troops_verify_infotext1 as "troops.verify.infoText" }