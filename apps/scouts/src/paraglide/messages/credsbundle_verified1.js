/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Verified1Inputs */

const en_credsbundle_verified1 = /** @type {(inputs: Credsbundle_Verified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`verified`)
};

const es_credsbundle_verified1 = /** @type {(inputs: Credsbundle_Verified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`verificado`)
};

const fr_credsbundle_verified1 = /** @type {(inputs: Credsbundle_Verified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vérifié`)
};

const ar_credsbundle_verified1 = /** @type {(inputs: Credsbundle_Verified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`verified`)
};

/**
* | output |
* | --- |
* | "verified" |
*
* @param {Credsbundle_Verified1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_verified1 = /** @type {((inputs?: Credsbundle_Verified1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Verified1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_verified1(inputs)
	if (locale === "es") return es_credsbundle_verified1(inputs)
	if (locale === "fr") return fr_credsbundle_verified1(inputs)
	return ar_credsbundle_verified1(inputs)
});
export { credsbundle_verified1 as "credsBundle.verified" }