/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Attachskills2Inputs */

const en_skillprofile_step2_attachskills2 = /** @type {(inputs: Skillprofile_Step2_Attachskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attach Skills`)
};

const es_skillprofile_step2_attachskills2 = /** @type {(inputs: Skillprofile_Step2_Attachskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adjuntar habilidades`)
};

const fr_skillprofile_step2_attachskills2 = /** @type {(inputs: Skillprofile_Step2_Attachskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joindre des compétences`)
};

const ar_skillprofile_step2_attachskills2 = /** @type {(inputs: Skillprofile_Step2_Attachskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرفاق المهارات`)
};

/**
* | output |
* | --- |
* | "Attach Skills" |
*
* @param {Skillprofile_Step2_Attachskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_attachskills2 = /** @type {((inputs?: Skillprofile_Step2_Attachskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Attachskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_attachskills2(inputs)
	if (locale === "es") return es_skillprofile_step2_attachskills2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_attachskills2(inputs)
	return ar_skillprofile_step2_attachskills2(inputs)
});
export { skillprofile_step2_attachskills2 as "skillProfile.step2.attachSkills" }