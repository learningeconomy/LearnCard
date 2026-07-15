/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Chapidesc32Inputs */

const en_credsbundle_chapidesc32 = /** @type {(inputs: Credsbundle_Chapidesc32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It allows your digital wallet to send or receive Verifiable Credentials from an independent third-party verifier or issuer in a way that establishes trust and preserves privacy.`)
};

const es_credsbundle_chapidesc32 = /** @type {(inputs: Credsbundle_Chapidesc32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permite que tu wallet digital envíe o reciba Credenciales Verificables de un verificador o emisor externo.`)
};

const fr_credsbundle_chapidesc32 = /** @type {(inputs: Credsbundle_Chapidesc32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elle permet à votre portefeuille numérique d'envoyer ou de recevoir des justificatifs vérifiables d'un émetteur ou vérificateur tiers indépendant, d'une manière qui établit la confiance et préserve la vie privée.`)
};

const ar_credsbundle_chapidesc32 = /** @type {(inputs: Credsbundle_Chapidesc32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`It allows your digital wallet to send or receive Verifiable Credentials from an independent third-party verifier or issuer in a way that establishes trust and preserves privacy.`)
};

/**
* | output |
* | --- |
* | "It allows your digital wallet to send or receive Verifiable Credentials from an independent third-party verifier or issuer in a way that establishes trust an..." |
*
* @param {Credsbundle_Chapidesc32Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_chapidesc32 = /** @type {((inputs?: Credsbundle_Chapidesc32Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Chapidesc32Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_chapidesc32(inputs)
	if (locale === "es") return es_credsbundle_chapidesc32(inputs)
	if (locale === "fr") return fr_credsbundle_chapidesc32(inputs)
	return ar_credsbundle_chapidesc32(inputs)
});
export { credsbundle_chapidesc32 as "credsBundle.chapiDesc3" }