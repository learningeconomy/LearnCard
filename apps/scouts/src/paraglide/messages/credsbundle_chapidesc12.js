/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Chapidesc12Inputs */

const en_credsbundle_chapidesc12 = /** @type {(inputs: Credsbundle_Chapidesc12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The Credential Handler API (CHAPI) is an open-source solution for communicating Verifiable Credentials on the Web.`)
};

const es_credsbundle_chapidesc12 = /** @type {(inputs: Credsbundle_Chapidesc12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La API de Gestor de Credenciales (CHAPI) es una solución de código abierto para comunicar Credenciales Verificables en la Web.`)
};

const fr_credsbundle_chapidesc12 = /** @type {(inputs: Credsbundle_Chapidesc12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'API de gestion des justificatifs (CHAPI) est une solution open source pour communiquer des justificatifs vérifiables sur le Web.`)
};

const ar_credsbundle_chapidesc12 = /** @type {(inputs: Credsbundle_Chapidesc12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The Credential Handler API (CHAPI) is an open-source solution for communicating Verifiable Credentials on the Web.`)
};

/**
* | output |
* | --- |
* | "The Credential Handler API (CHAPI) is an open-source solution for communicating Verifiable Credentials on the Web." |
*
* @param {Credsbundle_Chapidesc12Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_chapidesc12 = /** @type {((inputs?: Credsbundle_Chapidesc12Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Chapidesc12Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_chapidesc12(inputs)
	if (locale === "es") return es_credsbundle_chapidesc12(inputs)
	if (locale === "fr") return fr_credsbundle_chapidesc12(inputs)
	return ar_credsbundle_chapidesc12(inputs)
});
export { credsbundle_chapidesc12 as "credsBundle.chapiDesc1" }