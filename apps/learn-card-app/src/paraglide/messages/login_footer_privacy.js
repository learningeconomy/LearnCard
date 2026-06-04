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

const de_login_footer_privacy = /** @type {(inputs: Login_Footer_PrivacyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datenschutz`)
};

const ar_login_footer_privacy = /** @type {(inputs: Login_Footer_PrivacyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخصوصية`)
};

const fr_login_footer_privacy = /** @type {(inputs: Login_Footer_PrivacyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confidentialité`)
};

const ko_login_footer_privacy = /** @type {(inputs: Login_Footer_PrivacyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개인정보`)
};

/**
* | output |
* | --- |
* | "Privacy" |
*
* @param {Login_Footer_PrivacyInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_footer_privacy = /** @type {((inputs?: Login_Footer_PrivacyInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_PrivacyInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_privacy(inputs)
	if (locale === "es") return es_login_footer_privacy(inputs)
	if (locale === "de") return de_login_footer_privacy(inputs)
	if (locale === "ar") return ar_login_footer_privacy(inputs)
	if (locale === "fr") return fr_login_footer_privacy(inputs)
	return ko_login_footer_privacy(inputs)
});
export { login_footer_privacy as "login.footer.privacy" }