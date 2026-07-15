/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Footer_Editbtn1Inputs */

const en_troops_footer_editbtn1 = /** @type {(inputs: Troops_Footer_Editbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const es_troops_footer_editbtn1 = /** @type {(inputs: Troops_Footer_Editbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar`)
};

const fr_troops_footer_editbtn1 = /** @type {(inputs: Troops_Footer_Editbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_troops_footer_editbtn1 = /** @type {(inputs: Troops_Footer_Editbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Troops_Footer_Editbtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_footer_editbtn1 = /** @type {((inputs?: Troops_Footer_Editbtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Footer_Editbtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_footer_editbtn1(inputs)
	if (locale === "es") return es_troops_footer_editbtn1(inputs)
	if (locale === "fr") return fr_troops_footer_editbtn1(inputs)
	return ar_troops_footer_editbtn1(inputs)
});
export { troops_footer_editbtn1 as "troops.footer.editBtn" }