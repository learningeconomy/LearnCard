/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Footer_Selfcustodiallogin2Inputs */

const en_login_footer_selfcustodiallogin2 = /** @type {(inputs: Login_Footer_Selfcustodiallogin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self-custodial login.`)
};

const es_login_footer_selfcustodiallogin2 = /** @type {(inputs: Login_Footer_Selfcustodiallogin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicio de sesión autocustodiado.`)
};

const de_login_footer_selfcustodiallogin2 = /** @type {(inputs: Login_Footer_Selfcustodiallogin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selbstverwaltete Anmeldung.`)
};

const ar_login_footer_selfcustodiallogin2 = /** @type {(inputs: Login_Footer_Selfcustodiallogin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل دخول ذاتي الحراسة.`)
};

const fr_login_footer_selfcustodiallogin2 = /** @type {(inputs: Login_Footer_Selfcustodiallogin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion auto-hébergée.`)
};

const ko_login_footer_selfcustodiallogin2 = /** @type {(inputs: Login_Footer_Selfcustodiallogin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자체 보관 로그인.`)
};

/**
* | output |
* | --- |
* | "Self-custodial login." |
*
* @param {Login_Footer_Selfcustodiallogin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_footer_selfcustodiallogin2 = /** @type {((inputs?: Login_Footer_Selfcustodiallogin2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_Selfcustodiallogin2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_selfcustodiallogin2(inputs)
	if (locale === "es") return es_login_footer_selfcustodiallogin2(inputs)
	if (locale === "de") return de_login_footer_selfcustodiallogin2(inputs)
	if (locale === "ar") return ar_login_footer_selfcustodiallogin2(inputs)
	if (locale === "fr") return fr_login_footer_selfcustodiallogin2(inputs)
	return ko_login_footer_selfcustodiallogin2(inputs)
});
export { login_footer_selfcustodiallogin2 as "login.footer.selfCustodialLogin" }