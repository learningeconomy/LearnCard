/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Card2Inputs */

const en_learncardid_card2 = /** @type {(inputs: Learncardid_Card2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Card`)
};

const es_learncardid_card2 = /** @type {(inputs: Learncardid_Card2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tarjeta`)
};

const fr_learncardid_card2 = /** @type {(inputs: Learncardid_Card2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carte`)
};

const ar_learncardid_card2 = /** @type {(inputs: Learncardid_Card2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البطاقة`)
};

/**
* | output |
* | --- |
* | "Card" |
*
* @param {Learncardid_Card2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_card2 = /** @type {((inputs?: Learncardid_Card2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Card2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_card2(inputs)
	if (locale === "es") return es_learncardid_card2(inputs)
	if (locale === "fr") return fr_learncardid_card2(inputs)
	return ar_learncardid_card2(inputs)
});
export { learncardid_card2 as "learnCardId.card" }