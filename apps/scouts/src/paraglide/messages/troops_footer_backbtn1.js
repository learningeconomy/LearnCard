/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Footer_Backbtn1Inputs */

const en_troops_footer_backbtn1 = /** @type {(inputs: Troops_Footer_Backbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_troops_footer_backbtn1 = /** @type {(inputs: Troops_Footer_Backbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atrás`)
};

const fr_troops_footer_backbtn1 = /** @type {(inputs: Troops_Footer_Backbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_troops_footer_backbtn1 = /** @type {(inputs: Troops_Footer_Backbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Troops_Footer_Backbtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_footer_backbtn1 = /** @type {((inputs?: Troops_Footer_Backbtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Footer_Backbtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_footer_backbtn1(inputs)
	if (locale === "es") return es_troops_footer_backbtn1(inputs)
	if (locale === "fr") return fr_troops_footer_backbtn1(inputs)
	return ar_troops_footer_backbtn1(inputs)
});
export { troops_footer_backbtn1 as "troops.footer.backBtn" }