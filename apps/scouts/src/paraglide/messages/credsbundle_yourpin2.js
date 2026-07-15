/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Yourpin2Inputs */

const en_credsbundle_yourpin2 = /** @type {(inputs: Credsbundle_Yourpin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your PIN is: {pin}`)
};

const es_credsbundle_yourpin2 = /** @type {(inputs: Credsbundle_Yourpin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu PIN es: {pin}`)
};

const fr_credsbundle_yourpin2 = /** @type {(inputs: Credsbundle_Yourpin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre code PIN est : {pin}`)
};

const ar_credsbundle_yourpin2 = /** @type {(inputs: Credsbundle_Yourpin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز PIN الخاص بك هو: {pin}`)
};

/**
* | output |
* | --- |
* | "Your PIN is: {pin}" |
*
* @param {Credsbundle_Yourpin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_yourpin2 = /** @type {((inputs?: Credsbundle_Yourpin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Yourpin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_yourpin2(inputs)
	if (locale === "es") return es_credsbundle_yourpin2(inputs)
	if (locale === "fr") return fr_credsbundle_yourpin2(inputs)
	return ar_credsbundle_yourpin2(inputs)
});
export { credsbundle_yourpin2 as "credsBundle.yourPin" }