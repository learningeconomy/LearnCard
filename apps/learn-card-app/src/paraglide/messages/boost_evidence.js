/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_EvidenceInputs */

const en_boost_evidence = /** @type {(inputs: Boost_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evidence`)
};

const es_boost_evidence = /** @type {(inputs: Boost_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evidencia`)
};

const fr_boost_evidence = /** @type {(inputs: Boost_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preuve`)
};

const ar_boost_evidence = /** @type {(inputs: Boost_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدليل`)
};

/**
* | output |
* | --- |
* | "Evidence" |
*
* @param {Boost_EvidenceInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_evidence = /** @type {((inputs?: Boost_EvidenceInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_EvidenceInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_evidence(inputs)
	if (locale === "es") return es_boost_evidence(inputs)
	if (locale === "fr") return fr_boost_evidence(inputs)
	return ar_boost_evidence(inputs)
});
export { boost_evidence as "boost.evidence" }