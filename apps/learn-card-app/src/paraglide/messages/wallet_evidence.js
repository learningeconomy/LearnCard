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

const fr_wallet_evidence = /** @type {(inputs: Wallet_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preuve`)
};

const ar_wallet_evidence = /** @type {(inputs: Wallet_EvidenceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدليل`)
};

/**
* | output |
* | --- |
* | "Evidence" |
*
* @param {Wallet_EvidenceInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_evidence = /** @type {((inputs?: Wallet_EvidenceInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_EvidenceInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_evidence(inputs)
	if (locale === "es") return es_wallet_evidence(inputs)
	if (locale === "fr") return fr_wallet_evidence(inputs)
	return ar_wallet_evidence(inputs)
});
export { wallet_evidence as "wallet.evidence" }