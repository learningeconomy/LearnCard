/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Differentemail1Inputs */

const en_common_differentemail1 = /** @type {(inputs: Common_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a different email address`)
};

const es_common_differentemail1 = /** @type {(inputs: Common_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar otro correo`)
};

const fr_common_differentemail1 = /** @type {(inputs: Common_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser une autre adresse e-mail`)
};

const ar_common_differentemail1 = /** @type {(inputs: Common_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدام بريد إلكتروني آخر`)
};

/**
* | output |
* | --- |
* | "Use a different email address" |
*
* @param {Common_Differentemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_differentemail1 = /** @type {((inputs?: Common_Differentemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Differentemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_differentemail1(inputs)
	if (locale === "es") return es_common_differentemail1(inputs)
	if (locale === "fr") return fr_common_differentemail1(inputs)
	return ar_common_differentemail1(inputs)
});
export { common_differentemail1 as "common.differentEmail" }