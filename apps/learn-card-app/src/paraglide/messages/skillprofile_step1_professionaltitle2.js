/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step1_Professionaltitle2Inputs */

const en_skillprofile_step1_professionaltitle2 = /** @type {(inputs: Skillprofile_Step1_Professionaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Professional title`)
};

const es_skillprofile_step1_professionaltitle2 = /** @type {(inputs: Skillprofile_Step1_Professionaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título profesional`)
};

const fr_skillprofile_step1_professionaltitle2 = /** @type {(inputs: Skillprofile_Step1_Professionaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre professionnel`)
};

const ar_skillprofile_step1_professionaltitle2 = /** @type {(inputs: Skillprofile_Step1_Professionaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسمى المهني`)
};

/**
* | output |
* | --- |
* | "Professional title" |
*
* @param {Skillprofile_Step1_Professionaltitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step1_professionaltitle2 = /** @type {((inputs?: Skillprofile_Step1_Professionaltitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step1_Professionaltitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step1_professionaltitle2(inputs)
	if (locale === "es") return es_skillprofile_step1_professionaltitle2(inputs)
	if (locale === "fr") return fr_skillprofile_step1_professionaltitle2(inputs)
	return ar_skillprofile_step1_professionaltitle2(inputs)
});
export { skillprofile_step1_professionaltitle2 as "skillProfile.step1.professionalTitle" }