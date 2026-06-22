/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Aisession_Startedon2Inputs */

const en_aisession_startedon2 = /** @type {(inputs: Aisession_Startedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Started on ${i?.date}`)
};

const es_aisession_startedon2 = /** @type {(inputs: Aisession_Startedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Iniciado el ${i?.date}`)
};

const fr_aisession_startedon2 = /** @type {(inputs: Aisession_Startedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Commencé le ${i?.date}`)
};

const ar_aisession_startedon2 = /** @type {(inputs: Aisession_Startedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`بدأت في ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Started on {date}" |
*
* @param {Aisession_Startedon2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_startedon2 = /** @type {((inputs: Aisession_Startedon2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Startedon2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_startedon2(inputs)
	if (locale === "es") return es_aisession_startedon2(inputs)
	if (locale === "fr") return fr_aisession_startedon2(inputs)
	return ar_aisession_startedon2(inputs)
});
export { aisession_startedon2 as "aiSession.startedOn" }