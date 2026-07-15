/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Toggle1Inputs */

const en_credsbundle_toggle1 = /** @type {(inputs: Credsbundle_Toggle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`toggle`)
};

const es_credsbundle_toggle1 = /** @type {(inputs: Credsbundle_Toggle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`alternar`)
};

const fr_credsbundle_toggle1 = /** @type {(inputs: Credsbundle_Toggle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`basculer`)
};

const ar_credsbundle_toggle1 = /** @type {(inputs: Credsbundle_Toggle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`toggle`)
};

/**
* | output |
* | --- |
* | "toggle" |
*
* @param {Credsbundle_Toggle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_toggle1 = /** @type {((inputs?: Credsbundle_Toggle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Toggle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_toggle1(inputs)
	if (locale === "es") return es_credsbundle_toggle1(inputs)
	if (locale === "fr") return fr_credsbundle_toggle1(inputs)
	return ar_credsbundle_toggle1(inputs)
});
export { credsbundle_toggle1 as "credsBundle.toggle" }