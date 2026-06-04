/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_SubjectInputs */

const en_wallet_subject = /** @type {(inputs: Wallet_SubjectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subject`)
};

const es_wallet_subject = /** @type {(inputs: Wallet_SubjectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asunto`)
};

const de_wallet_subject = /** @type {(inputs: Wallet_SubjectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Betreff`)
};

const ar_wallet_subject = /** @type {(inputs: Wallet_SubjectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموضوع`)
};

const fr_wallet_subject = /** @type {(inputs: Wallet_SubjectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sujet`)
};

const ko_wallet_subject = /** @type {(inputs: Wallet_SubjectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`대상`)
};

/**
* | output |
* | --- |
* | "Subject" |
*
* @param {Wallet_SubjectInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_subject = /** @type {((inputs?: Wallet_SubjectInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_SubjectInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subject(inputs)
	if (locale === "es") return es_wallet_subject(inputs)
	if (locale === "de") return de_wallet_subject(inputs)
	if (locale === "ar") return ar_wallet_subject(inputs)
	if (locale === "fr") return fr_wallet_subject(inputs)
	return ko_wallet_subject(inputs)
});
export { wallet_subject as "wallet.subject" }