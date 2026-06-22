/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Modal_Footer_EndorseInputs */

const en_endorsement_modal_footer_endorse = /** @type {(inputs: Endorsement_Modal_Footer_EndorseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Endorse`)
};

const es_endorsement_modal_footer_endorse = /** @type {(inputs: Endorsement_Modal_Footer_EndorseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avalar`)
};

const fr_endorsement_modal_footer_endorse = /** @type {(inputs: Endorsement_Modal_Footer_EndorseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommander`)
};

const ar_endorsement_modal_footer_endorse = /** @type {(inputs: Endorsement_Modal_Footer_EndorseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توصية`)
};

/**
* | output |
* | --- |
* | "Endorse" |
*
* @param {Endorsement_Modal_Footer_EndorseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_modal_footer_endorse = /** @type {((inputs?: Endorsement_Modal_Footer_EndorseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Modal_Footer_EndorseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_modal_footer_endorse(inputs)
	if (locale === "es") return es_endorsement_modal_footer_endorse(inputs)
	if (locale === "fr") return fr_endorsement_modal_footer_endorse(inputs)
	return ar_endorsement_modal_footer_endorse(inputs)
});
export { endorsement_modal_footer_endorse as "endorsement.modal.footer.endorse" }