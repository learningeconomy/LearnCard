/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Template_Joinbtn1Inputs */

const en_troops_template_joinbtn1 = /** @type {(inputs: Troops_Template_Joinbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join`)
};

const es_troops_template_joinbtn1 = /** @type {(inputs: Troops_Template_Joinbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unirse`)
};

const fr_troops_template_joinbtn1 = /** @type {(inputs: Troops_Template_Joinbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoindre`)
};

const ar_troops_template_joinbtn1 = /** @type {(inputs: Troops_Template_Joinbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join`)
};

/**
* | output |
* | --- |
* | "Join" |
*
* @param {Troops_Template_Joinbtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_template_joinbtn1 = /** @type {((inputs?: Troops_Template_Joinbtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Template_Joinbtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_template_joinbtn1(inputs)
	if (locale === "es") return es_troops_template_joinbtn1(inputs)
	if (locale === "fr") return fr_troops_template_joinbtn1(inputs)
	return ar_troops_template_joinbtn1(inputs)
});
export { troops_template_joinbtn1 as "troops.template.joinBtn" }