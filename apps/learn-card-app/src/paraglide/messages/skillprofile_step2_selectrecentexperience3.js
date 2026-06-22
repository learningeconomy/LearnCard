/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Selectrecentexperience3Inputs */

const en_skillprofile_step2_selectrecentexperience3 = /** @type {(inputs: Skillprofile_Step2_Selectrecentexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select your most recent work experience`)
};

const es_skillprofile_step2_selectrecentexperience3 = /** @type {(inputs: Skillprofile_Step2_Selectrecentexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona tu experiencia laboral más reciente`)
};

const fr_skillprofile_step2_selectrecentexperience3 = /** @type {(inputs: Skillprofile_Step2_Selectrecentexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez votre expérience professionnelle la plus récente`)
};

const ar_skillprofile_step2_selectrecentexperience3 = /** @type {(inputs: Skillprofile_Step2_Selectrecentexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر أحدث خبرة عمل لديك`)
};

/**
* | output |
* | --- |
* | "Select your most recent work experience" |
*
* @param {Skillprofile_Step2_Selectrecentexperience3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_selectrecentexperience3 = /** @type {((inputs?: Skillprofile_Step2_Selectrecentexperience3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Selectrecentexperience3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_selectrecentexperience3(inputs)
	if (locale === "es") return es_skillprofile_step2_selectrecentexperience3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_selectrecentexperience3(inputs)
	return ar_skillprofile_step2_selectrecentexperience3(inputs)
});
export { skillprofile_step2_selectrecentexperience3 as "skillProfile.step2.selectRecentExperience" }