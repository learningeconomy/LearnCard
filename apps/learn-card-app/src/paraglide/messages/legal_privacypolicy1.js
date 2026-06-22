/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Privacypolicy1Inputs */

const en_legal_privacypolicy1 = /** @type {(inputs: Legal_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_legal_privacypolicy1 = /** @type {(inputs: Legal_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de privacidad`)
};

const fr_legal_privacypolicy1 = /** @type {(inputs: Legal_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de confidentialité`)
};

const ar_legal_privacypolicy1 = /** @type {(inputs: Legal_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة الخصوصية`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Legal_Privacypolicy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const legal_privacypolicy1 = /** @type {((inputs?: Legal_Privacypolicy1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Privacypolicy1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_privacypolicy1(inputs)
	if (locale === "es") return es_legal_privacypolicy1(inputs)
	if (locale === "fr") return fr_legal_privacypolicy1(inputs)
	return ar_legal_privacypolicy1(inputs)
});
export { legal_privacypolicy1 as "legal.privacyPolicy" }