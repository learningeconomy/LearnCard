/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Card1Inputs */

const en_scoutsid_card1 = /** @type {(inputs: Scoutsid_Card1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Card`)
};

const es_scoutsid_card1 = /** @type {(inputs: Scoutsid_Card1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tarjeta`)
};

const fr_scoutsid_card1 = /** @type {(inputs: Scoutsid_Card1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carte`)
};

const ar_scoutsid_card1 = /** @type {(inputs: Scoutsid_Card1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Card`)
};

/**
* | output |
* | --- |
* | "Card" |
*
* @param {Scoutsid_Card1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_card1 = /** @type {((inputs?: Scoutsid_Card1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Card1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_card1(inputs)
	if (locale === "es") return es_scoutsid_card1(inputs)
	if (locale === "fr") return fr_scoutsid_card1(inputs)
	return ar_scoutsid_card1(inputs)
});
export { scoutsid_card1 as "scoutsId.card" }