/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_EvidenceInputs */

const en_wallet_evidence = /** @type {(inputs: Wallet_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evidence`)
};

const es_wallet_evidence = /** @type {(inputs: Wallet_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evidencia`)
};

const de_wallet_evidence = /** @type {(inputs: Wallet_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nachweis`)
};

const ar_wallet_evidence = /** @type {(inputs: Wallet_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدليل`)
};

const fr_wallet_evidence = /** @type {(inputs: Wallet_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preuve`)
};

const ko_wallet_evidence = /** @type {(inputs: Wallet_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`증빙`)
};

/**
* | output |
* | --- |
* | "Evidence" |
*
* @param {Wallet_EvidenceInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_evidence = /** @type {((inputs?: Wallet_EvidenceInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_EvidenceInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_evidence(inputs)
	if (locale === "es") return es_wallet_evidence(inputs)
	if (locale === "de") return de_wallet_evidence(inputs)
	if (locale === "ar") return ar_wallet_evidence(inputs)
	if (locale === "fr") return fr_wallet_evidence(inputs)
	return ko_wallet_evidence(inputs)
});
export { wallet_evidence as "wallet.evidence" }