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

const fr_legal_dataownership1 = /** @type {(inputs: Legal_Dataownership1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos données vous appartiennent.`)
};

const ar_legal_dataownership1 = /** @type {(inputs: Legal_Dataownership1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بياناتك ملكك.`)
};

/**
* | output |
* | --- |
* | "You own your own data." |
*
* @param {Legal_Dataownership1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const legal_dataownership1 = /** @type {((inputs?: Legal_Dataownership1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Dataownership1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_dataownership1(inputs)
	if (locale === "es") return es_legal_dataownership1(inputs)
	if (locale === "fr") return fr_legal_dataownership1(inputs)
	return ar_legal_dataownership1(inputs)
});
export { legal_dataownership1 as "legal.dataOwnership" }