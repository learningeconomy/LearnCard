/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Authenticboost2Inputs */

const en_credsbundle_authenticboost2 = /** @type {(inputs: Credsbundle_Authenticboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Authentic Boost:`)
};

const es_credsbundle_authenticboost2 = /** @type {(inputs: Credsbundle_Authenticboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Auténtico:`)
};

const fr_credsbundle_authenticboost2 = /** @type {(inputs: Credsbundle_Authenticboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost authentique :`)
};

const ar_credsbundle_authenticboost2 = /** @type {(inputs: Credsbundle_Authenticboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعزيز أصيل:`)
};

/**
* | output |
* | --- |
* | "Authentic Boost:" |
*
* @param {Credsbundle_Authenticboost2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_authenticboost2 = /** @type {((inputs?: Credsbundle_Authenticboost2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Authenticboost2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_authenticboost2(inputs)
	if (locale === "es") return es_credsbundle_authenticboost2(inputs)
	if (locale === "fr") return fr_credsbundle_authenticboost2(inputs)
	return ar_credsbundle_authenticboost2(inputs)
});
export { credsbundle_authenticboost2 as "credsBundle.authenticBoost" }