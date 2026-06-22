/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Boost_Expiredheader1Inputs */

const en_claim_boost_expiredheader1 = /** @type {(inputs: Claim_Boost_Expiredheader1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The boost claim link has expired or has reached the maximum number of times it can be claimed.`)
};

const es_claim_boost_expiredheader1 = /** @type {(inputs: Claim_Boost_Expiredheader1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El enlace para reclamar el Boost ha caducado o ha alcanzado el número máximo de veces que puede reclamarse.`)
};

const fr_claim_boost_expiredheader1 = /** @type {(inputs: Claim_Boost_Expiredheader1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le lien de réclamation du Boost a expiré ou a atteint le nombre maximal de réclamations autorisées.`)
};

const ar_claim_boost_expiredheader1 = /** @type {(inputs: Claim_Boost_Expiredheader1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتهت صلاحية رابط المطالبة بالـ Boost أو بلغ الحد الأقصى لعدد مرات المطالبة به.`)
};

/**
* | output |
* | --- |
* | "The boost claim link has expired or has reached the maximum number of times it can be claimed." |
*
* @param {Claim_Boost_Expiredheader1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_boost_expiredheader1 = /** @type {((inputs?: Claim_Boost_Expiredheader1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Boost_Expiredheader1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_boost_expiredheader1(inputs)
	if (locale === "es") return es_claim_boost_expiredheader1(inputs)
	if (locale === "fr") return fr_claim_boost_expiredheader1(inputs)
	return ar_claim_boost_expiredheader1(inputs)
});
export { claim_boost_expiredheader1 as "claim.boost.expiredHeader" }