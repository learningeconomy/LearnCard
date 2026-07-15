/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Issuedtoby2Inputs */

const en_troops_issuedtoby2 = /** @type {(inputs: Troops_Issuedtoby2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued to {title} by {name}`)
};

const es_troops_issuedtoby2 = /** @type {(inputs: Troops_Issuedtoby2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitido a {title} por {name}`)
};

const fr_troops_issuedtoby2 = /** @type {(inputs: Troops_Issuedtoby2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivré à {title} par {name}`)
};

const ar_troops_issuedtoby2 = /** @type {(inputs: Troops_Issuedtoby2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدر لـ {title} بواسطة {name}`)
};

/**
* | output |
* | --- |
* | "Issued to {title} by {name}" |
*
* @param {Troops_Issuedtoby2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_issuedtoby2 = /** @type {((inputs?: Troops_Issuedtoby2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Issuedtoby2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_issuedtoby2(inputs)
	if (locale === "es") return es_troops_issuedtoby2(inputs)
	if (locale === "fr") return fr_troops_issuedtoby2(inputs)
	return ar_troops_issuedtoby2(inputs)
});
export { troops_issuedtoby2 as "troops.issuedToBy" }