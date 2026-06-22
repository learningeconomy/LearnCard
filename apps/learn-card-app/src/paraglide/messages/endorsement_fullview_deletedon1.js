/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Endorsement_Fullview_Deletedon1Inputs */

const en_endorsement_fullview_deletedon1 = /** @type {(inputs: Endorsement_Fullview_Deletedon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Deleted on ${i?.date}`)
};

const es_endorsement_fullview_deletedon1 = /** @type {(inputs: Endorsement_Fullview_Deletedon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Eliminado el ${i?.date}`)
};

const fr_endorsement_fullview_deletedon1 = /** @type {(inputs: Endorsement_Fullview_Deletedon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Supprimé le ${i?.date}`)
};

const ar_endorsement_fullview_deletedon1 = /** @type {(inputs: Endorsement_Fullview_Deletedon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حُذف في ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Deleted on {date}" |
*
* @param {Endorsement_Fullview_Deletedon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_deletedon1 = /** @type {((inputs: Endorsement_Fullview_Deletedon1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_Deletedon1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_deletedon1(inputs)
	if (locale === "es") return es_endorsement_fullview_deletedon1(inputs)
	if (locale === "fr") return fr_endorsement_fullview_deletedon1(inputs)
	return ar_endorsement_fullview_deletedon1(inputs)
});
export { endorsement_fullview_deletedon1 as "endorsement.fullview.deletedOn" }