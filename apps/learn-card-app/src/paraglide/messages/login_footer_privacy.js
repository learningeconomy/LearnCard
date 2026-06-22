/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Footer_PrivacyInputs */

const en_login_footer_privacy = /** @type {(inputs: Login_Footer_PrivacyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy`)
};

const es_login_footer_privacy = /** @type {(inputs: Login_Footer_PrivacyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacidad`)
};

const fr_login_footer_privacy = /** @type {(inputs: Login_Footer_PrivacyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confidentialité`)
};

const ar_login_footer_privacy = /** @type {(inputs: Login_Footer_PrivacyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخصوصية`)
};

/**
* | output |
* | --- |
* | "Privacy" |
*
* @param {Login_Footer_PrivacyInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_footer_privacy = /** @type {((inputs?: Login_Footer_PrivacyInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_PrivacyInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_privacy(inputs)
	if (locale === "es") return es_login_footer_privacy(inputs)
	if (locale === "fr") return fr_login_footer_privacy(inputs)
	return ar_login_footer_privacy(inputs)
});
export { login_footer_privacy as "login.footer.privacy" }