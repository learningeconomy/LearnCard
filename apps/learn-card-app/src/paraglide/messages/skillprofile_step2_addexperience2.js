/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Addexperience2Inputs */

const en_skillprofile_step2_addexperience2 = /** @type {(inputs: Skillprofile_Step2_Addexperience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Experience`)
};

const es_skillprofile_step2_addexperience2 = /** @type {(inputs: Skillprofile_Step2_Addexperience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir experiencia`)
};

const fr_skillprofile_step2_addexperience2 = /** @type {(inputs: Skillprofile_Step2_Addexperience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une expérience`)
};

const ar_skillprofile_step2_addexperience2 = /** @type {(inputs: Skillprofile_Step2_Addexperience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة خبرة`)
};

/**
* | output |
* | --- |
* | "Add Experience" |
*
* @param {Skillprofile_Step2_Addexperience2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_addexperience2 = /** @type {((inputs?: Skillprofile_Step2_Addexperience2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Addexperience2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_addexperience2(inputs)
	if (locale === "es") return es_skillprofile_step2_addexperience2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_addexperience2(inputs)
	return ar_skillprofile_step2_addexperience2(inputs)
});
export { skillprofile_step2_addexperience2 as "skillProfile.step2.addExperience" }