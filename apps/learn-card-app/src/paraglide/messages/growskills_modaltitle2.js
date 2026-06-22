/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Growskills_Modaltitle2Inputs */

const en_growskills_modaltitle2 = /** @type {(inputs: Growskills_Modaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grow your skills`)
};

const es_growskills_modaltitle2 = /** @type {(inputs: Growskills_Modaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desarrolla tus habilidades`)
};

const fr_growskills_modaltitle2 = /** @type {(inputs: Growskills_Modaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développez vos compétences`)
};

const ar_growskills_modaltitle2 = /** @type {(inputs: Growskills_Modaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نمّ مهاراتك`)
};

/**
* | output |
* | --- |
* | "Grow your skills" |
*
* @param {Growskills_Modaltitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const growskills_modaltitle2 = /** @type {((inputs?: Growskills_Modaltitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Growskills_Modaltitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_growskills_modaltitle2(inputs)
	if (locale === "es") return es_growskills_modaltitle2(inputs)
	if (locale === "fr") return fr_growskills_modaltitle2(inputs)
	return ar_growskills_modaltitle2(inputs)
});
export { growskills_modaltitle2 as "growSkills.modalTitle" }