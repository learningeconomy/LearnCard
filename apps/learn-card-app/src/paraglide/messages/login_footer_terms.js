/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Footer_TermsInputs */

const en_login_footer_terms = /** @type {(inputs: Login_Footer_TermsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms`)
};

const es_login_footer_terms = /** @type {(inputs: Login_Footer_TermsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos`)
};

const de_login_footer_terms = /** @type {(inputs: Login_Footer_TermsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AGB`)
};

const ar_login_footer_terms = /** @type {(inputs: Login_Footer_TermsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشروط`)
};

const fr_login_footer_terms = /** @type {(inputs: Login_Footer_TermsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions`)
};

const ko_login_footer_terms = /** @type {(inputs: Login_Footer_TermsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이용약관`)
};

/**
* | output |
* | --- |
* | "Terms" |
*
* @param {Login_Footer_TermsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_footer_terms = /** @type {((inputs?: Login_Footer_TermsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_TermsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_terms(inputs)
	if (locale === "es") return es_login_footer_terms(inputs)
	if (locale === "de") return de_login_footer_terms(inputs)
	if (locale === "ar") return ar_login_footer_terms(inputs)
	if (locale === "fr") return fr_login_footer_terms(inputs)
	return ko_login_footer_terms(inputs)
});
export { login_footer_terms as "login.footer.terms" }