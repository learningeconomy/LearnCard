/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Boost_AcceptedInputs */

const en_claim_boost_accepted = /** @type {(inputs: Claim_Boost_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepted`)
};

const es_claim_boost_accepted = /** @type {(inputs: Claim_Boost_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptada`)
};

const fr_claim_boost_accepted = /** @type {(inputs: Claim_Boost_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepté`)
};

const ar_claim_boost_accepted = /** @type {(inputs: Claim_Boost_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم القبول`)
};

/**
* | output |
* | --- |
* | "Accepted" |
*
* @param {Claim_Boost_AcceptedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_boost_accepted = /** @type {((inputs?: Claim_Boost_AcceptedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Boost_AcceptedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_boost_accepted(inputs)
	if (locale === "es") return es_claim_boost_accepted(inputs)
	if (locale === "fr") return fr_claim_boost_accepted(inputs)
	return ar_claim_boost_accepted(inputs)
});
export { claim_boost_accepted as "claim.boost.accepted" }