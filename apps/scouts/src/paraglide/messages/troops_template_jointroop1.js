/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Template_Jointroop1Inputs */

const en_troops_template_jointroop1 = /** @type {(inputs: Troops_Template_Jointroop1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join Troop`)
};

const es_troops_template_jointroop1 = /** @type {(inputs: Troops_Template_Jointroop1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unirse al Troop`)
};

const fr_troops_template_jointroop1 = /** @type {(inputs: Troops_Template_Jointroop1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoindre la troupe`)
};

const ar_troops_template_jointroop1 = /** @type {(inputs: Troops_Template_Jointroop1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join Troop`)
};

/**
* | output |
* | --- |
* | "Join Troop" |
*
* @param {Troops_Template_Jointroop1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_template_jointroop1 = /** @type {((inputs?: Troops_Template_Jointroop1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Template_Jointroop1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_template_jointroop1(inputs)
	if (locale === "es") return es_troops_template_jointroop1(inputs)
	if (locale === "fr") return fr_troops_template_jointroop1(inputs)
	return ar_troops_template_jointroop1(inputs)
});
export { troops_template_jointroop1 as "troops.template.joinTroop" }