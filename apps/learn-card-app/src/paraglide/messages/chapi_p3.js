/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Chapi_P3Inputs */

const en_chapi_p3 = /** @type {(inputs: Chapi_P3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It allows your digital wallet to send or receive Verifiable Credentials from an independent third-party verifier or issuer in a way that establishes trust and preserves privacy.`)
};

const es_chapi_p3 = /** @type {(inputs: Chapi_P3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permite que tu cartera digital envíe o reciba credenciales verificables de un verificador o emisor externo independiente, de una manera que establece confianza y preserva la privacidad.`)
};

const fr_chapi_p3 = /** @type {(inputs: Chapi_P3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elle permet à votre portefeuille numérique d'envoyer ou de recevoir des justificatifs vérifiables d'un vérificateur ou d'un émetteur tiers indépendant, d'une manière qui établit la confiance et préserve la confidentialité.`)
};

const ar_chapi_p3 = /** @type {(inputs: Chapi_P3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتيح لمحفظتك الرقمية إرسال أو استقبال بيانات اعتماد قابلة للتحقق من مُحقِّق أو جهة إصدار خارجية مستقلة، بطريقة تُرسّخ الثقة وتحافظ على الخصوصية.`)
};

/**
* | output |
* | --- |
* | "It allows your digital wallet to send or receive Verifiable Credentials from an independent third-party verifier or issuer in a way that establishes trust an..." |
*
* @param {Chapi_P3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const chapi_p3 = /** @type {((inputs?: Chapi_P3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Chapi_P3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_chapi_p3(inputs)
	if (locale === "es") return es_chapi_p3(inputs)
	if (locale === "fr") return fr_chapi_p3(inputs)
	return ar_chapi_p3(inputs)
});
export { chapi_p3 as "chapi.p3" }