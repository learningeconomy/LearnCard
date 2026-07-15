/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Template_ByInputs */

const en_troops_template_by = /** @type {(inputs: Troops_Template_ByInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`by {issuer}`)
};

const es_troops_template_by = /** @type {(inputs: Troops_Template_ByInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`por {issuer}`)
};

const fr_troops_template_by = /** @type {(inputs: Troops_Template_ByInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`par {issuer}`)
};

const ar_troops_template_by = /** @type {(inputs: Troops_Template_ByInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`by {issuer}`)
};

/**
* | output |
* | --- |
* | "by {issuer}" |
*
* @param {Troops_Template_ByInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_template_by = /** @type {((inputs?: Troops_Template_ByInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Template_ByInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_template_by(inputs)
	if (locale === "es") return es_troops_template_by(inputs)
	if (locale === "fr") return fr_troops_template_by(inputs)
	return ar_troops_template_by(inputs)
});
export { troops_template_by as "troops.template.by" }