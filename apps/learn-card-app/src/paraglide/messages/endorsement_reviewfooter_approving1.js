/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Reviewfooter_Approving1Inputs */

const en_endorsement_reviewfooter_approving1 = /** @type {(inputs: Endorsement_Reviewfooter_Approving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approving...`)
};

const es_endorsement_reviewfooter_approving1 = /** @type {(inputs: Endorsement_Reviewfooter_Approving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobando...`)
};

const fr_endorsement_reviewfooter_approving1 = /** @type {(inputs: Endorsement_Reviewfooter_Approving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approbation...`)
};

const ar_endorsement_reviewfooter_approving1 = /** @type {(inputs: Endorsement_Reviewfooter_Approving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الموافقة...`)
};

/**
* | output |
* | --- |
* | "Approving..." |
*
* @param {Endorsement_Reviewfooter_Approving1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_reviewfooter_approving1 = /** @type {((inputs?: Endorsement_Reviewfooter_Approving1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Reviewfooter_Approving1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_reviewfooter_approving1(inputs)
	if (locale === "es") return es_endorsement_reviewfooter_approving1(inputs)
	if (locale === "fr") return fr_endorsement_reviewfooter_approving1(inputs)
	return ar_endorsement_reviewfooter_approving1(inputs)
});
export { endorsement_reviewfooter_approving1 as "endorsement.reviewFooter.approving" }