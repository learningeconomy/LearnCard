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

const fr_wallet_subject = /** @type {(inputs: Wallet_SubjectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sujet`)
};

const ar_wallet_subject = /** @type {(inputs: Wallet_SubjectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموضوع`)
};

/**
* | output |
* | --- |
* | "Subject" |
*
* @param {Wallet_SubjectInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subject = /** @type {((inputs?: Wallet_SubjectInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_SubjectInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subject(inputs)
	if (locale === "es") return es_wallet_subject(inputs)
	if (locale === "fr") return fr_wallet_subject(inputs)
	return ar_wallet_subject(inputs)
});
export { wallet_subject as "wallet.subject" }