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

const fr_login_footer_selfcustodiallogin2 = /** @type {(inputs: Login_Footer_Selfcustodiallogin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion auto-hébergée.`)
};

const ar_login_footer_selfcustodiallogin2 = /** @type {(inputs: Login_Footer_Selfcustodiallogin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل دخول ذاتي الحراسة.`)
};

/**
* | output |
* | --- |
* | "Self-custodial login." |
*
* @param {Login_Footer_Selfcustodiallogin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_footer_selfcustodiallogin2 = /** @type {((inputs?: Login_Footer_Selfcustodiallogin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_Selfcustodiallogin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_selfcustodiallogin2(inputs)
	if (locale === "es") return es_login_footer_selfcustodiallogin2(inputs)
	if (locale === "fr") return fr_login_footer_selfcustodiallogin2(inputs)
	return ar_login_footer_selfcustodiallogin2(inputs)
});
export { login_footer_selfcustodiallogin2 as "login.footer.selfCustodialLogin" }