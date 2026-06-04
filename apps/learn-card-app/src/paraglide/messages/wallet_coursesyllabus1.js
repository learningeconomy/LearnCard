/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Coursesyllabus1Inputs */

const en_wallet_coursesyllabus1 = /** @type {(inputs: Wallet_Coursesyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Course Syllabus`)
};

const es_wallet_coursesyllabus1 = /** @type {(inputs: Wallet_Coursesyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Programa del curso`)
};

const de_wallet_coursesyllabus1 = /** @type {(inputs: Wallet_Coursesyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kurslehrplan`)
};

const ar_wallet_coursesyllabus1 = /** @type {(inputs: Wallet_Coursesyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منهج الدورة`)
};

const fr_wallet_coursesyllabus1 = /** @type {(inputs: Wallet_Coursesyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Programme du cours`)
};

const ko_wallet_coursesyllabus1 = /** @type {(inputs: Wallet_Coursesyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`강의계획서`)
};

/**
* | output |
* | --- |
* | "Course Syllabus" |
*
* @param {Wallet_Coursesyllabus1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_coursesyllabus1 = /** @type {((inputs?: Wallet_Coursesyllabus1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Coursesyllabus1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_coursesyllabus1(inputs)
	if (locale === "es") return es_wallet_coursesyllabus1(inputs)
	if (locale === "de") return de_wallet_coursesyllabus1(inputs)
	if (locale === "ar") return ar_wallet_coursesyllabus1(inputs)
	if (locale === "fr") return fr_wallet_coursesyllabus1(inputs)
	return ko_wallet_coursesyllabus1(inputs)
});
export { wallet_coursesyllabus1 as "wallet.courseSyllabus" }