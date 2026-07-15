/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Template_Issuedto1Inputs */

const en_troops_template_issuedto1 = /** @type {(inputs: Troops_Template_Issuedto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued to {name}`)
};

const es_troops_template_issuedto1 = /** @type {(inputs: Troops_Template_Issuedto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitido a {name}`)
};

const fr_troops_template_issuedto1 = /** @type {(inputs: Troops_Template_Issuedto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivré à {name}`)
};

const ar_troops_template_issuedto1 = /** @type {(inputs: Troops_Template_Issuedto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدر لـ {name}`)
};

/**
* | output |
* | --- |
* | "Issued to {name}" |
*
* @param {Troops_Template_Issuedto1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_template_issuedto1 = /** @type {((inputs?: Troops_Template_Issuedto1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Template_Issuedto1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_template_issuedto1(inputs)
	if (locale === "es") return es_troops_template_issuedto1(inputs)
	if (locale === "fr") return fr_troops_template_issuedto1(inputs)
	return ar_troops_template_issuedto1(inputs)
});
export { troops_template_issuedto1 as "troops.template.issuedTo" }