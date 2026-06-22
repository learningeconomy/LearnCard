/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Finish1Inputs */

const en_aisession_finish1 = /** @type {(inputs: Aisession_Finish1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finish`)
};

const es_aisession_finish1 = /** @type {(inputs: Aisession_Finish1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finalizar`)
};

const fr_aisession_finish1 = /** @type {(inputs: Aisession_Finish1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminer`)
};

const ar_aisession_finish1 = /** @type {(inputs: Aisession_Finish1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنهاء`)
};

/**
* | output |
* | --- |
* | "Finish" |
*
* @param {Aisession_Finish1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_finish1 = /** @type {((inputs?: Aisession_Finish1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Finish1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_finish1(inputs)
	if (locale === "es") return es_aisession_finish1(inputs)
	if (locale === "fr") return fr_aisession_finish1(inputs)
	return ar_aisession_finish1(inputs)
});
export { aisession_finish1 as "aiSession.finish" }