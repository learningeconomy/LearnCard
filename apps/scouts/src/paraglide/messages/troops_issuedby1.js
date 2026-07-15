/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Issuedby1Inputs */

const en_troops_issuedby1 = /** @type {(inputs: Troops_Issuedby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued by:`)
};

const es_troops_issuedby1 = /** @type {(inputs: Troops_Issuedby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitido por:`)
};

const fr_troops_issuedby1 = /** @type {(inputs: Troops_Issuedby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivré par :`)
};

const ar_troops_issuedby1 = /** @type {(inputs: Troops_Issuedby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued by:`)
};

/**
* | output |
* | --- |
* | "Issued by:" |
*
* @param {Troops_Issuedby1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_issuedby1 = /** @type {((inputs?: Troops_Issuedby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Issuedby1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_issuedby1(inputs)
	if (locale === "es") return es_troops_issuedby1(inputs)
	if (locale === "fr") return fr_troops_issuedby1(inputs)
	return ar_troops_issuedby1(inputs)
});
export { troops_issuedby1 as "troops.issuedBy" }