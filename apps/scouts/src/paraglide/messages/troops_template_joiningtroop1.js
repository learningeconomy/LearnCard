/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Template_Joiningtroop1Inputs */

const en_troops_template_joiningtroop1 = /** @type {(inputs: Troops_Template_Joiningtroop1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joining`)
};

const es_troops_template_joiningtroop1 = /** @type {(inputs: Troops_Template_Joiningtroop1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uniéndose`)
};

const fr_troops_template_joiningtroop1 = /** @type {(inputs: Troops_Template_Joiningtroop1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adhésion en cours`)
};

const ar_troops_template_joiningtroop1 = /** @type {(inputs: Troops_Template_Joiningtroop1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joining`)
};

/**
* | output |
* | --- |
* | "Joining" |
*
* @param {Troops_Template_Joiningtroop1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_template_joiningtroop1 = /** @type {((inputs?: Troops_Template_Joiningtroop1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Template_Joiningtroop1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_template_joiningtroop1(inputs)
	if (locale === "es") return es_troops_template_joiningtroop1(inputs)
	if (locale === "fr") return fr_troops_template_joiningtroop1(inputs)
	return ar_troops_template_joiningtroop1(inputs)
});
export { troops_template_joiningtroop1 as "troops.template.joiningTroop" }