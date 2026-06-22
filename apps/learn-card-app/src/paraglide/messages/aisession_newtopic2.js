/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Newtopic2Inputs */

const en_aisession_newtopic2 = /** @type {(inputs: Aisession_Newtopic2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Topic`)
};

const es_aisession_newtopic2 = /** @type {(inputs: Aisession_Newtopic2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo tema`)
};

const fr_aisession_newtopic2 = /** @type {(inputs: Aisession_Newtopic2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau sujet`)
};

const ar_aisession_newtopic2 = /** @type {(inputs: Aisession_Newtopic2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موضوع جديد`)
};

/**
* | output |
* | --- |
* | "New Topic" |
*
* @param {Aisession_Newtopic2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_newtopic2 = /** @type {((inputs?: Aisession_Newtopic2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Newtopic2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_newtopic2(inputs)
	if (locale === "es") return es_aisession_newtopic2(inputs)
	if (locale === "fr") return fr_aisession_newtopic2(inputs)
	return ar_aisession_newtopic2(inputs)
});
export { aisession_newtopic2 as "aiSession.newTopic" }