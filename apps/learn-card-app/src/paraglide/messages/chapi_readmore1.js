/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Chapi_Readmore1Inputs */

const en_chapi_readmore1 = /** @type {(inputs: Chapi_Readmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read More`)
};

const es_chapi_readmore1 = /** @type {(inputs: Chapi_Readmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leer más`)
};

const fr_chapi_readmore1 = /** @type {(inputs: Chapi_Readmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En savoir plus`)
};

const ar_chapi_readmore1 = /** @type {(inputs: Chapi_Readmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اقرأ المزيد`)
};

/**
* | output |
* | --- |
* | "Read More" |
*
* @param {Chapi_Readmore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const chapi_readmore1 = /** @type {((inputs?: Chapi_Readmore1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Chapi_Readmore1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_chapi_readmore1(inputs)
	if (locale === "es") return es_chapi_readmore1(inputs)
	if (locale === "fr") return fr_chapi_readmore1(inputs)
	return ar_chapi_readmore1(inputs)
});
export { chapi_readmore1 as "chapi.readMore" }