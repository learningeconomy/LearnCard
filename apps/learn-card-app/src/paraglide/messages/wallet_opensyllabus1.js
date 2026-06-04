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

const de_wallet_opensyllabus1 = /** @type {(inputs: Wallet_Opensyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lehrplan öffnen`)
};

const ar_wallet_opensyllabus1 = /** @type {(inputs: Wallet_Opensyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح المنهج`)
};

const fr_wallet_opensyllabus1 = /** @type {(inputs: Wallet_Opensyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le programme`)
};

const ko_wallet_opensyllabus1 = /** @type {(inputs: Wallet_Opensyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`강의계획서 열기`)
};

/**
* | output |
* | --- |
* | "Open Syllabus" |
*
* @param {Wallet_Opensyllabus1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_opensyllabus1 = /** @type {((inputs?: Wallet_Opensyllabus1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Opensyllabus1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_opensyllabus1(inputs)
	if (locale === "es") return es_wallet_opensyllabus1(inputs)
	if (locale === "de") return de_wallet_opensyllabus1(inputs)
	if (locale === "ar") return ar_wallet_opensyllabus1(inputs)
	if (locale === "fr") return fr_wallet_opensyllabus1(inputs)
	return ko_wallet_opensyllabus1(inputs)
});
export { wallet_opensyllabus1 as "wallet.openSyllabus" }