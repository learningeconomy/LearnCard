/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Modal_Success_Signinbutton2Inputs */

const en_endorsement_modal_success_signinbutton2 = /** @type {(inputs: Endorsement_Modal_Success_Signinbutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in to send`)
};

const es_endorsement_modal_success_signinbutton2 = /** @type {(inputs: Endorsement_Modal_Success_Signinbutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión para enviar`)
};

const fr_endorsement_modal_success_signinbutton2 = /** @type {(inputs: Endorsement_Modal_Success_Signinbutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter pour envoyer`)
};

const ar_endorsement_modal_success_signinbutton2 = /** @type {(inputs: Endorsement_Modal_Success_Signinbutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجّل الدخول للإرسال`)
};

/**
* | output |
* | --- |
* | "Sign in to send" |
*
* @param {Endorsement_Modal_Success_Signinbutton2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_modal_success_signinbutton2 = /** @type {((inputs?: Endorsement_Modal_Success_Signinbutton2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Modal_Success_Signinbutton2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_modal_success_signinbutton2(inputs)
	if (locale === "es") return es_endorsement_modal_success_signinbutton2(inputs)
	if (locale === "fr") return fr_endorsement_modal_success_signinbutton2(inputs)
	return ar_endorsement_modal_success_signinbutton2(inputs)
});
export { endorsement_modal_success_signinbutton2 as "endorsement.modal.success.signInButton" }