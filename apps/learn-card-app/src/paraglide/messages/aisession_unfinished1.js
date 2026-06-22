/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Unfinished1Inputs */

const en_aisession_unfinished1 = /** @type {(inputs: Aisession_Unfinished1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unfinished`)
};

const es_aisession_unfinished1 = /** @type {(inputs: Aisession_Unfinished1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin terminar`)
};

const fr_aisession_unfinished1 = /** @type {(inputs: Aisession_Unfinished1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inachevé`)
};

const ar_aisession_unfinished1 = /** @type {(inputs: Aisession_Unfinished1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير مكتمل`)
};

/**
* | output |
* | --- |
* | "Unfinished" |
*
* @param {Aisession_Unfinished1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_unfinished1 = /** @type {((inputs?: Aisession_Unfinished1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Unfinished1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_unfinished1(inputs)
	if (locale === "es") return es_aisession_unfinished1(inputs)
	if (locale === "fr") return fr_aisession_unfinished1(inputs)
	return ar_aisession_unfinished1(inputs)
});
export { aisession_unfinished1 as "aiSession.unfinished" }