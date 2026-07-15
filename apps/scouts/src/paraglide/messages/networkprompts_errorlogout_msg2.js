/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Errorlogout_Msg2Inputs */

const en_networkprompts_errorlogout_msg2 = /** @type {(inputs: Networkprompts_Errorlogout_Msg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`There was a sign-in error. Please log out and log back into the app to fix this error.`)
};

const es_networkprompts_errorlogout_msg2 = /** @type {(inputs: Networkprompts_Errorlogout_Msg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hubo un error de inicio de sesión. Cierra sesión y vuelve a iniciarla para solucionarlo.`)
};

const fr_networkprompts_errorlogout_msg2 = /** @type {(inputs: Networkprompts_Errorlogout_Msg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur de connexion est survenue. Veuillez vous déconnecter et vous reconnecter à l'application pour résoudre ce problème.`)
};

const ar_networkprompts_errorlogout_msg2 = /** @type {(inputs: Networkprompts_Errorlogout_Msg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ في تسجيل الدخول. يرجى تسجيل الخروج وإعادة تسجيل الدخول إلى التطبيق لإصلاح هذا الخطأ.`)
};

/**
* | output |
* | --- |
* | "There was a sign-in error. Please log out and log back into the app to fix this error." |
*
* @param {Networkprompts_Errorlogout_Msg2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_errorlogout_msg2 = /** @type {((inputs?: Networkprompts_Errorlogout_Msg2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Errorlogout_Msg2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_errorlogout_msg2(inputs)
	if (locale === "es") return es_networkprompts_errorlogout_msg2(inputs)
	if (locale === "fr") return fr_networkprompts_errorlogout_msg2(inputs)
	return ar_networkprompts_errorlogout_msg2(inputs)
});
export { networkprompts_errorlogout_msg2 as "networkPrompts.errorLogout.msg" }