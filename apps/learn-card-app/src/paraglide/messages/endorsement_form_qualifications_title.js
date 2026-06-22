/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Qualifications_TitleInputs */

const en_endorsement_form_qualifications_title = /** @type {(inputs: Endorsement_Form_Qualifications_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share your qualifications that support this endorsement.`)
};

const es_endorsement_form_qualifications_title = /** @type {(inputs: Endorsement_Form_Qualifications_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte tus cualificaciones que respaldan este aval.`)
};

const fr_endorsement_form_qualifications_title = /** @type {(inputs: Endorsement_Form_Qualifications_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez vos qualifications qui appuient cette recommandation.`)
};

const ar_endorsement_form_qualifications_title = /** @type {(inputs: Endorsement_Form_Qualifications_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارك مؤهلاتك التي تدعم هذه التوصية.`)
};

/**
* | output |
* | --- |
* | "Share your qualifications that support this endorsement." |
*
* @param {Endorsement_Form_Qualifications_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_qualifications_title = /** @type {((inputs?: Endorsement_Form_Qualifications_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Qualifications_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_qualifications_title(inputs)
	if (locale === "es") return es_endorsement_form_qualifications_title(inputs)
	if (locale === "fr") return fr_endorsement_form_qualifications_title(inputs)
	return ar_endorsement_form_qualifications_title(inputs)
});
export { endorsement_form_qualifications_title as "endorsement.form.qualifications.title" }