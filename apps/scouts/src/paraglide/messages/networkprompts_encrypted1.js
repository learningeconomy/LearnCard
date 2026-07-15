/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Encrypted1Inputs */

const en_networkprompts_encrypted1 = /** @type {(inputs: Networkprompts_Encrypted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All connections are encrypted.`)
};

const es_networkprompts_encrypted1 = /** @type {(inputs: Networkprompts_Encrypted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas las conexiones están cifradas.`)
};

const fr_networkprompts_encrypted1 = /** @type {(inputs: Networkprompts_Encrypted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les connexions sont chiffrées.`)
};

const ar_networkprompts_encrypted1 = /** @type {(inputs: Networkprompts_Encrypted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All connections are encrypted.`)
};

/**
* | output |
* | --- |
* | "All connections are encrypted." |
*
* @param {Networkprompts_Encrypted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_encrypted1 = /** @type {((inputs?: Networkprompts_Encrypted1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Encrypted1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_encrypted1(inputs)
	if (locale === "es") return es_networkprompts_encrypted1(inputs)
	if (locale === "fr") return fr_networkprompts_encrypted1(inputs)
	return ar_networkprompts_encrypted1(inputs)
});
export { networkprompts_encrypted1 as "networkPrompts.encrypted" }