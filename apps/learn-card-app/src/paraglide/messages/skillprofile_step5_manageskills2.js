/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step5_Manageskills2Inputs */

const en_skillprofile_step5_manageskills2 = /** @type {(inputs: Skillprofile_Step5_Manageskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage your current skills`)
};

const es_skillprofile_step5_manageskills2 = /** @type {(inputs: Skillprofile_Step5_Manageskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestiona tus habilidades actuales`)
};

const fr_skillprofile_step5_manageskills2 = /** @type {(inputs: Skillprofile_Step5_Manageskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérez vos compétences actuelles`)
};

const ar_skillprofile_step5_manageskills2 = /** @type {(inputs: Skillprofile_Step5_Manageskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة مهاراتك الحالية`)
};

/**
* | output |
* | --- |
* | "Manage your current skills" |
*
* @param {Skillprofile_Step5_Manageskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step5_manageskills2 = /** @type {((inputs?: Skillprofile_Step5_Manageskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step5_Manageskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step5_manageskills2(inputs)
	if (locale === "es") return es_skillprofile_step5_manageskills2(inputs)
	if (locale === "fr") return fr_skillprofile_step5_manageskills2(inputs)
	return ar_skillprofile_step5_manageskills2(inputs)
});
export { skillprofile_step5_manageskills2 as "skillProfile.step5.manageSkills" }