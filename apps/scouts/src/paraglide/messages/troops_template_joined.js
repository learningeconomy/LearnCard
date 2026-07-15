/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Template_JoinedInputs */

const en_troops_template_joined = /** @type {(inputs: Troops_Template_JoinedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joined`)
};

const es_troops_template_joined = /** @type {(inputs: Troops_Template_JoinedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unido`)
};

const fr_troops_template_joined = /** @type {(inputs: Troops_Template_JoinedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membre`)
};

const ar_troops_template_joined = /** @type {(inputs: Troops_Template_JoinedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joined`)
};

/**
* | output |
* | --- |
* | "Joined" |
*
* @param {Troops_Template_JoinedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_template_joined = /** @type {((inputs?: Troops_Template_JoinedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Template_JoinedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_template_joined(inputs)
	if (locale === "es") return es_troops_template_joined(inputs)
	if (locale === "fr") return fr_troops_template_joined(inputs)
	return ar_troops_template_joined(inputs)
});
export { troops_template_joined as "troops.template.joined" }