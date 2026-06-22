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

const fr_login_footer_terms = /** @type {(inputs: Login_Footer_TermsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions`)
};

const ar_login_footer_terms = /** @type {(inputs: Login_Footer_TermsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشروط`)
};

/**
* | output |
* | --- |
* | "Terms" |
*
* @param {Login_Footer_TermsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_footer_terms = /** @type {((inputs?: Login_Footer_TermsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_TermsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_terms(inputs)
	if (locale === "es") return es_login_footer_terms(inputs)
	if (locale === "fr") return fr_login_footer_terms(inputs)
	return ar_login_footer_terms(inputs)
});
export { login_footer_terms as "login.footer.terms" }