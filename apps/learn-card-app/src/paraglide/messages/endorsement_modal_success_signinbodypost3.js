/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Modal_Success_Signinbodypost3Inputs */

const en_endorsement_modal_success_signinbodypost3 = /** @type {(inputs: Endorsement_Modal_Success_Signinbodypost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`endorsement.`)
};

const es_endorsement_modal_success_signinbodypost3 = /** @type {(inputs: Endorsement_Modal_Success_Signinbodypost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`aval.`)
};

const fr_endorsement_modal_success_signinbodypost3 = /** @type {(inputs: Endorsement_Modal_Success_Signinbodypost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`recommandation.`)
};

const ar_endorsement_modal_success_signinbodypost3 = /** @type {(inputs: Endorsement_Modal_Success_Signinbodypost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توصيتك.`)
};

/**
* | output |
* | --- |
* | "endorsement." |
*
* @param {Endorsement_Modal_Success_Signinbodypost3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_modal_success_signinbodypost3 = /** @type {((inputs?: Endorsement_Modal_Success_Signinbodypost3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Modal_Success_Signinbodypost3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_modal_success_signinbodypost3(inputs)
	if (locale === "es") return es_endorsement_modal_success_signinbodypost3(inputs)
	if (locale === "fr") return fr_endorsement_modal_success_signinbodypost3(inputs)
	return ar_endorsement_modal_success_signinbodypost3(inputs)
});
export { endorsement_modal_success_signinbodypost3 as "endorsement.modal.success.signInBodyPost" }