/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step1_Title1Inputs */

const en_skillprofile_step1_title1 = /** @type {(inputs: Skillprofile_Step1_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grow your skills and explore opportunities`)
};

const es_skillprofile_step1_title1 = /** @type {(inputs: Skillprofile_Step1_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desarrolla tus habilidades y explora oportunidades`)
};

const fr_skillprofile_step1_title1 = /** @type {(inputs: Skillprofile_Step1_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développez vos compétences et explorez des opportunités`)
};

const ar_skillprofile_step1_title1 = /** @type {(inputs: Skillprofile_Step1_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طوّر مهاراتك واستكشف الفرص`)
};

/**
* | output |
* | --- |
* | "Grow your skills and explore opportunities" |
*
* @param {Skillprofile_Step1_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step1_title1 = /** @type {((inputs?: Skillprofile_Step1_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step1_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step1_title1(inputs)
	if (locale === "es") return es_skillprofile_step1_title1(inputs)
	if (locale === "fr") return fr_skillprofile_step1_title1(inputs)
	return ar_skillprofile_step1_title1(inputs)
});
export { skillprofile_step1_title1 as "skillProfile.step1.title" }