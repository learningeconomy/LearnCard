/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Dataownership1Inputs */

const en_legal_dataownership1 = /** @type {(inputs: Legal_Dataownership1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You own your own data.`)
};

const es_legal_dataownership1 = /** @type {(inputs: Legal_Dataownership1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus datos te pertenecen.`)
};

const de_legal_dataownership1 = /** @type {(inputs: Legal_Dataownership1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deine Daten gehören dir.`)
};

const ar_legal_dataownership1 = /** @type {(inputs: Legal_Dataownership1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بياناتك ملكك.`)
};

const fr_legal_dataownership1 = /** @type {(inputs: Legal_Dataownership1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos données vous appartiennent.`)
};

const ko_legal_dataownership1 = /** @type {(inputs: Legal_Dataownership1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`나의 데이터는 나의 것입니다.`)
};

/**
* | output |
* | --- |
* | "You own your own data." |
*
* @param {Legal_Dataownership1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const legal_dataownership1 = /** @type {((inputs?: Legal_Dataownership1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Dataownership1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_dataownership1(inputs)
	if (locale === "es") return es_legal_dataownership1(inputs)
	if (locale === "de") return de_legal_dataownership1(inputs)
	if (locale === "ar") return ar_legal_dataownership1(inputs)
	if (locale === "fr") return fr_legal_dataownership1(inputs)
	return ko_legal_dataownership1(inputs)
});
export { legal_dataownership1 as "legal.dataOwnership" }