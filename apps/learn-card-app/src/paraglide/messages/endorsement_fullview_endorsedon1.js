/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Endorsement_Fullview_Endorsedon1Inputs */

const en_endorsement_fullview_endorsedon1 = /** @type {(inputs: Endorsement_Fullview_Endorsedon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Endorsed on ${i?.date}`)
};

const es_endorsement_fullview_endorsedon1 = /** @type {(inputs: Endorsement_Fullview_Endorsedon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Avalado el ${i?.date}`)
};

const fr_endorsement_fullview_endorsedon1 = /** @type {(inputs: Endorsement_Fullview_Endorsedon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Recommandé le ${i?.date}`)
};

const ar_endorsement_fullview_endorsedon1 = /** @type {(inputs: Endorsement_Fullview_Endorsedon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تمت التوصية في ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Endorsed on {date}" |
*
* @param {Endorsement_Fullview_Endorsedon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_endorsedon1 = /** @type {((inputs: Endorsement_Fullview_Endorsedon1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_Endorsedon1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_endorsedon1(inputs)
	if (locale === "es") return es_endorsement_fullview_endorsedon1(inputs)
	if (locale === "fr") return fr_endorsement_fullview_endorsedon1(inputs)
	return ar_endorsement_fullview_endorsedon1(inputs)
});
export { endorsement_fullview_endorsedon1 as "endorsement.fullview.endorsedOn" }