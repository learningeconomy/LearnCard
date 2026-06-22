/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Reviewfooter_Approved1Inputs */

const en_endorsement_reviewfooter_approved1 = /** @type {(inputs: Endorsement_Reviewfooter_Approved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approved`)
};

const es_endorsement_reviewfooter_approved1 = /** @type {(inputs: Endorsement_Reviewfooter_Approved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobado`)
};

const fr_endorsement_reviewfooter_approved1 = /** @type {(inputs: Endorsement_Reviewfooter_Approved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuvé`)
};

const ar_endorsement_reviewfooter_approved1 = /** @type {(inputs: Endorsement_Reviewfooter_Approved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الموافقة`)
};

/**
* | output |
* | --- |
* | "Approved" |
*
* @param {Endorsement_Reviewfooter_Approved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_reviewfooter_approved1 = /** @type {((inputs?: Endorsement_Reviewfooter_Approved1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Reviewfooter_Approved1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_reviewfooter_approved1(inputs)
	if (locale === "es") return es_endorsement_reviewfooter_approved1(inputs)
	if (locale === "fr") return fr_endorsement_reviewfooter_approved1(inputs)
	return ar_endorsement_reviewfooter_approved1(inputs)
});
export { endorsement_reviewfooter_approved1 as "endorsement.reviewFooter.approved" }