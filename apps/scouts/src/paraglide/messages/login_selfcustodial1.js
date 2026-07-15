/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Selfcustodial1Inputs */

const en_login_selfcustodial1 = /** @type {(inputs: Login_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self-custodial login.`)
};

const es_login_selfcustodial1 = /** @type {(inputs: Login_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicio de sesión autocustodiado.`)
};

const fr_login_selfcustodial1 = /** @type {(inputs: Login_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion auto-hébergée.`)
};

const ar_login_selfcustodial1 = /** @type {(inputs: Login_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self-custodial login.`)
};

/**
* | output |
* | --- |
* | "Self-custodial login." |
*
* @param {Login_Selfcustodial1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_selfcustodial1 = /** @type {((inputs?: Login_Selfcustodial1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Selfcustodial1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_selfcustodial1(inputs)
	if (locale === "es") return es_login_selfcustodial1(inputs)
	if (locale === "fr") return fr_login_selfcustodial1(inputs)
	return ar_login_selfcustodial1(inputs)
});
export { login_selfcustodial1 as "login.selfCustodial" }