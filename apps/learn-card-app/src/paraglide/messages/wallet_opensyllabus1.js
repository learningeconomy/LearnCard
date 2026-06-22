/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Opensyllabus1Inputs */

const en_wallet_opensyllabus1 = /** @type {(inputs: Wallet_Opensyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Syllabus`)
};

const es_wallet_opensyllabus1 = /** @type {(inputs: Wallet_Opensyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir programa`)
};

const fr_wallet_opensyllabus1 = /** @type {(inputs: Wallet_Opensyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le programme`)
};

const ar_wallet_opensyllabus1 = /** @type {(inputs: Wallet_Opensyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح المنهج`)
};

/**
* | output |
* | --- |
* | "Open Syllabus" |
*
* @param {Wallet_Opensyllabus1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_opensyllabus1 = /** @type {((inputs?: Wallet_Opensyllabus1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Opensyllabus1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_opensyllabus1(inputs)
	if (locale === "es") return es_wallet_opensyllabus1(inputs)
	if (locale === "fr") return fr_wallet_opensyllabus1(inputs)
	return ar_wallet_opensyllabus1(inputs)
});
export { wallet_opensyllabus1 as "wallet.openSyllabus" }