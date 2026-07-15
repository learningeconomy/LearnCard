/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Errorlogout_Logoutbtn3Inputs */

const en_networkprompts_errorlogout_logoutbtn3 = /** @type {(inputs: Networkprompts_Errorlogout_Logoutbtn3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logout`)
};

const es_networkprompts_errorlogout_logoutbtn3 = /** @type {(inputs: Networkprompts_Errorlogout_Logoutbtn3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar Sesión`)
};

const fr_networkprompts_errorlogout_logoutbtn3 = /** @type {(inputs: Networkprompts_Errorlogout_Logoutbtn3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion`)
};

const ar_networkprompts_errorlogout_logoutbtn3 = /** @type {(inputs: Networkprompts_Errorlogout_Logoutbtn3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الخروج`)
};

/**
* | output |
* | --- |
* | "Logout" |
*
* @param {Networkprompts_Errorlogout_Logoutbtn3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_errorlogout_logoutbtn3 = /** @type {((inputs?: Networkprompts_Errorlogout_Logoutbtn3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Errorlogout_Logoutbtn3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_errorlogout_logoutbtn3(inputs)
	if (locale === "es") return es_networkprompts_errorlogout_logoutbtn3(inputs)
	if (locale === "fr") return fr_networkprompts_errorlogout_logoutbtn3(inputs)
	return ar_networkprompts_errorlogout_logoutbtn3(inputs)
});
export { networkprompts_errorlogout_logoutbtn3 as "networkPrompts.errorLogout.logoutBtn" }