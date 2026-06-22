/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Yourphrase1Inputs */

const en_recovery_yourphrase1 = /** @type {(inputs: Recovery_Yourphrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your phrase`)
};

const es_recovery_yourphrase1 = /** @type {(inputs: Recovery_Yourphrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu frase`)
};

const fr_recovery_yourphrase1 = /** @type {(inputs: Recovery_Yourphrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre phrase`)
};

const ar_recovery_yourphrase1 = /** @type {(inputs: Recovery_Yourphrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارتك`)
};

/**
* | output |
* | --- |
* | "Your phrase" |
*
* @param {Recovery_Yourphrase1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_yourphrase1 = /** @type {((inputs?: Recovery_Yourphrase1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Yourphrase1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_yourphrase1(inputs)
	if (locale === "es") return es_recovery_yourphrase1(inputs)
	if (locale === "fr") return fr_recovery_yourphrase1(inputs)
	return ar_recovery_yourphrase1(inputs)
});
export { recovery_yourphrase1 as "recovery.yourPhrase" }