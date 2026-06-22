/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Modal_Success_Thankspost1Inputs */

const en_endorsement_modal_success_thankspost1 = /** @type {(inputs: Endorsement_Modal_Success_Thankspost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your endorsement is temporarily saved.`)
};

const es_endorsement_modal_success_thankspost1 = /** @type {(inputs: Endorsement_Modal_Success_Thankspost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu aval se ha guardado temporalmente.`)
};

const fr_endorsement_modal_success_thankspost1 = /** @type {(inputs: Endorsement_Modal_Success_Thankspost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre recommandation est enregistrée temporairement.`)
};

const ar_endorsement_modal_success_thankspost1 = /** @type {(inputs: Endorsement_Modal_Success_Thankspost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ توصيتك مؤقتًا.`)
};

/**
* | output |
* | --- |
* | "Your endorsement is temporarily saved." |
*
* @param {Endorsement_Modal_Success_Thankspost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_modal_success_thankspost1 = /** @type {((inputs?: Endorsement_Modal_Success_Thankspost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Modal_Success_Thankspost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_modal_success_thankspost1(inputs)
	if (locale === "es") return es_endorsement_modal_success_thankspost1(inputs)
	if (locale === "fr") return fr_endorsement_modal_success_thankspost1(inputs)
	return ar_endorsement_modal_success_thankspost1(inputs)
});
export { endorsement_modal_success_thankspost1 as "endorsement.modal.success.thanksPost" }