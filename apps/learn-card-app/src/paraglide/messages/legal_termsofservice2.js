/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Termsofservice2Inputs */

const en_legal_termsofservice2 = /** @type {(inputs: Legal_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

const es_legal_termsofservice2 = /** @type {(inputs: Legal_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos de servicio`)
};

const de_legal_termsofservice2 = /** @type {(inputs: Legal_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nutzungsbedingungen`)
};

const ar_legal_termsofservice2 = /** @type {(inputs: Legal_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شروط الخدمة`)
};

const fr_legal_termsofservice2 = /** @type {(inputs: Legal_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions d'utilisation`)
};

const ko_legal_termsofservice2 = /** @type {(inputs: Legal_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`서비스 약관`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Legal_Termsofservice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const legal_termsofservice2 = /** @type {((inputs?: Legal_Termsofservice2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Termsofservice2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_termsofservice2(inputs)
	if (locale === "es") return es_legal_termsofservice2(inputs)
	if (locale === "de") return de_legal_termsofservice2(inputs)
	if (locale === "ar") return ar_legal_termsofservice2(inputs)
	if (locale === "fr") return fr_legal_termsofservice2(inputs)
	return ko_legal_termsofservice2(inputs)
});
export { legal_termsofservice2 as "legal.termsOfService" }