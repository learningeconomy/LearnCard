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

const de_boost_evidence = /** @type {(inputs: Boost_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nachweis`)
};

const ar_boost_evidence = /** @type {(inputs: Boost_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدليل`)
};

const fr_boost_evidence = /** @type {(inputs: Boost_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preuve`)
};

const ko_boost_evidence = /** @type {(inputs: Boost_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`증빙`)
};

/**
* | output |
* | --- |
* | "Evidence" |
*
* @param {Boost_EvidenceInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_evidence = /** @type {((inputs?: Boost_EvidenceInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_EvidenceInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_evidence(inputs)
	if (locale === "es") return es_boost_evidence(inputs)
	if (locale === "de") return de_boost_evidence(inputs)
	if (locale === "ar") return ar_boost_evidence(inputs)
	if (locale === "fr") return fr_boost_evidence(inputs)
	return ko_boost_evidence(inputs)
});
export { boost_evidence as "boost.evidence" }