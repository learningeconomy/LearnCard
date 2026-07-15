/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Chapidesc22Inputs */

const en_credsbundle_chapidesc22 = /** @type {(inputs: Credsbundle_Chapidesc22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Think, trusted and confidential carrier pigeon, but for Verifiable Credentials.`)
};

const es_credsbundle_chapidesc22 = /** @type {(inputs: Credsbundle_Chapidesc22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Piénsalo como una paloma mensajera de confianza y confidencial, pero para Credenciales Verificables.`)
};

const fr_credsbundle_chapidesc22 = /** @type {(inputs: Credsbundle_Chapidesc22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imaginez un pigeon voyageur de confiance et confidentiel, mais pour les justificatifs vérifiables.`)
};

const ar_credsbundle_chapidesc22 = /** @type {(inputs: Credsbundle_Chapidesc22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Think, trusted and confidential carrier pigeon, but for Verifiable Credentials.`)
};

/**
* | output |
* | --- |
* | "Think, trusted and confidential carrier pigeon, but for Verifiable Credentials." |
*
* @param {Credsbundle_Chapidesc22Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_chapidesc22 = /** @type {((inputs?: Credsbundle_Chapidesc22Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Chapidesc22Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_chapidesc22(inputs)
	if (locale === "es") return es_credsbundle_chapidesc22(inputs)
	if (locale === "fr") return fr_credsbundle_chapidesc22(inputs)
	return ar_credsbundle_chapidesc22(inputs)
});
export { credsbundle_chapidesc22 as "credsBundle.chapiDesc2" }