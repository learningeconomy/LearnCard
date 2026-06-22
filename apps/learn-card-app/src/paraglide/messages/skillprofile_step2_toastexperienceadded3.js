/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Toastexperienceadded3Inputs */

const en_skillprofile_step2_toastexperienceadded3 = /** @type {(inputs: Skillprofile_Step2_Toastexperienceadded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work experience added`)
};

const es_skillprofile_step2_toastexperienceadded3 = /** @type {(inputs: Skillprofile_Step2_Toastexperienceadded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencia laboral añadida`)
};

const fr_skillprofile_step2_toastexperienceadded3 = /** @type {(inputs: Skillprofile_Step2_Toastexperienceadded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience professionnelle ajoutée`)
};

const ar_skillprofile_step2_toastexperienceadded3 = /** @type {(inputs: Skillprofile_Step2_Toastexperienceadded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إضافة الخبرة المهنية`)
};

/**
* | output |
* | --- |
* | "Work experience added" |
*
* @param {Skillprofile_Step2_Toastexperienceadded3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_toastexperienceadded3 = /** @type {((inputs?: Skillprofile_Step2_Toastexperienceadded3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Toastexperienceadded3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_toastexperienceadded3(inputs)
	if (locale === "es") return es_skillprofile_step2_toastexperienceadded3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_toastexperienceadded3(inputs)
	return ar_skillprofile_step2_toastexperienceadded3(inputs)
});
export { skillprofile_step2_toastexperienceadded3 as "skillProfile.step2.toastExperienceAdded" }