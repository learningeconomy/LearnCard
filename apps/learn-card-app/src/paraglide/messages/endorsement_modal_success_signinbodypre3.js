/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Modal_Success_Signinbodypre3Inputs */

const en_endorsement_modal_success_signinbodypre3 = /** @type {(inputs: Endorsement_Modal_Success_Signinbodypre3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in to send your`)
};

const es_endorsement_modal_success_signinbodypre3 = /** @type {(inputs: Endorsement_Modal_Success_Signinbodypre3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión para enviar tu`)
};

const fr_endorsement_modal_success_signinbodypre3 = /** @type {(inputs: Endorsement_Modal_Success_Signinbodypre3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous pour envoyer votre`)
};

const ar_endorsement_modal_success_signinbodypre3 = /** @type {(inputs: Endorsement_Modal_Success_Signinbodypre3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجّل الدخول لإرسال`)
};

/**
* | output |
* | --- |
* | "Sign in to send your" |
*
* @param {Endorsement_Modal_Success_Signinbodypre3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_modal_success_signinbodypre3 = /** @type {((inputs?: Endorsement_Modal_Success_Signinbodypre3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Modal_Success_Signinbodypre3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_modal_success_signinbodypre3(inputs)
	if (locale === "es") return es_endorsement_modal_success_signinbodypre3(inputs)
	if (locale === "fr") return fr_endorsement_modal_success_signinbodypre3(inputs)
	return ar_endorsement_modal_success_signinbodypre3(inputs)
});
export { endorsement_modal_success_signinbodypre3 as "endorsement.modal.success.signInBodyPre" }