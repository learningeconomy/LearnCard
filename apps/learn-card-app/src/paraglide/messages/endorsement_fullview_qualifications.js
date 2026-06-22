/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Fullview_QualificationsInputs */

const en_endorsement_fullview_qualifications = /** @type {(inputs: Endorsement_Fullview_QualificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qualifications`)
};

const es_endorsement_fullview_qualifications = /** @type {(inputs: Endorsement_Fullview_QualificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cualificaciones`)
};

const fr_endorsement_fullview_qualifications = /** @type {(inputs: Endorsement_Fullview_QualificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qualifications`)
};

const ar_endorsement_fullview_qualifications = /** @type {(inputs: Endorsement_Fullview_QualificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المؤهلات`)
};

/**
* | output |
* | --- |
* | "Qualifications" |
*
* @param {Endorsement_Fullview_QualificationsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_qualifications = /** @type {((inputs?: Endorsement_Fullview_QualificationsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_QualificationsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_qualifications(inputs)
	if (locale === "es") return es_endorsement_fullview_qualifications(inputs)
	if (locale === "fr") return fr_endorsement_fullview_qualifications(inputs)
	return ar_endorsement_fullview_qualifications(inputs)
});
export { endorsement_fullview_qualifications as "endorsement.fullview.qualifications" }