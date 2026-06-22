/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Growskills_Title1Inputs */

const en_growskills_title1 = /** @type {(inputs: Growskills_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grow Skills`)
};

const es_growskills_title1 = /** @type {(inputs: Growskills_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desarrollar habilidades`)
};

const fr_growskills_title1 = /** @type {(inputs: Growskills_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développer les compétences`)
};

const ar_growskills_title1 = /** @type {(inputs: Growskills_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنمية المهارات`)
};

/**
* | output |
* | --- |
* | "Grow Skills" |
*
* @param {Growskills_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const growskills_title1 = /** @type {((inputs?: Growskills_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Growskills_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_growskills_title1(inputs)
	if (locale === "es") return es_growskills_title1(inputs)
	if (locale === "fr") return fr_growskills_title1(inputs)
	return ar_growskills_title1(inputs)
});
export { growskills_title1 as "growSkills.title" }