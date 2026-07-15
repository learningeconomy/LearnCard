/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Shareall2Inputs */

const en_credsbundle_shareall2 = /** @type {(inputs: Credsbundle_Shareall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share all {type}s`)
};

const es_credsbundle_shareall2 = /** @type {(inputs: Credsbundle_Shareall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir todos los {type}s`)
};

const fr_credsbundle_shareall2 = /** @type {(inputs: Credsbundle_Shareall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager tous les {type}s`)
};

const ar_credsbundle_shareall2 = /** @type {(inputs: Credsbundle_Shareall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share all {type}s`)
};

/**
* | output |
* | --- |
* | "Share all {type}s" |
*
* @param {Credsbundle_Shareall2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_shareall2 = /** @type {((inputs?: Credsbundle_Shareall2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Shareall2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_shareall2(inputs)
	if (locale === "es") return es_credsbundle_shareall2(inputs)
	if (locale === "fr") return fr_credsbundle_shareall2(inputs)
	return ar_credsbundle_shareall2(inputs)
});
export { credsbundle_shareall2 as "credsBundle.shareAll" }