/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Reviewfooter_Approve1Inputs */

const en_endorsement_reviewfooter_approve1 = /** @type {(inputs: Endorsement_Reviewfooter_Approve1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approve`)
};

const es_endorsement_reviewfooter_approve1 = /** @type {(inputs: Endorsement_Reviewfooter_Approve1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobar`)
};

const fr_endorsement_reviewfooter_approve1 = /** @type {(inputs: Endorsement_Reviewfooter_Approve1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuver`)
};

const ar_endorsement_reviewfooter_approve1 = /** @type {(inputs: Endorsement_Reviewfooter_Approve1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موافقة`)
};

/**
* | output |
* | --- |
* | "Approve" |
*
* @param {Endorsement_Reviewfooter_Approve1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_reviewfooter_approve1 = /** @type {((inputs?: Endorsement_Reviewfooter_Approve1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Reviewfooter_Approve1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_reviewfooter_approve1(inputs)
	if (locale === "es") return es_endorsement_reviewfooter_approve1(inputs)
	if (locale === "fr") return fr_endorsement_reviewfooter_approve1(inputs)
	return ar_endorsement_reviewfooter_approve1(inputs)
});
export { endorsement_reviewfooter_approve1 as "endorsement.reviewFooter.approve" }