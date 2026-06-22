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

const fr_wallet_coursesyllabus1 = /** @type {(inputs: Wallet_Coursesyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Programme du cours`)
};

const ar_wallet_coursesyllabus1 = /** @type {(inputs: Wallet_Coursesyllabus1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منهج الدورة`)
};

/**
* | output |
* | --- |
* | "Course Syllabus" |
*
* @param {Wallet_Coursesyllabus1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_coursesyllabus1 = /** @type {((inputs?: Wallet_Coursesyllabus1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Coursesyllabus1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_coursesyllabus1(inputs)
	if (locale === "es") return es_wallet_coursesyllabus1(inputs)
	if (locale === "fr") return fr_wallet_coursesyllabus1(inputs)
	return ar_wallet_coursesyllabus1(inputs)
});
export { wallet_coursesyllabus1 as "wallet.courseSyllabus" }