/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Fieldofstudyhelp5Inputs */

const en_developerportal_credentialbuilder_achievement_fieldofstudyhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudyhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Academic discipline`)
};

const es_developerportal_credentialbuilder_achievement_fieldofstudyhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudyhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disciplina académica`)
};

const fr_developerportal_credentialbuilder_achievement_fieldofstudyhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudyhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Discipline académique`)
};

const ar_developerportal_credentialbuilder_achievement_fieldofstudyhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudyhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التخصص الأكاديمي`)
};

/**
* | output |
* | --- |
* | "Academic discipline" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Fieldofstudyhelp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_fieldofstudyhelp5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Fieldofstudyhelp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Fieldofstudyhelp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_fieldofstudyhelp5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_fieldofstudyhelp5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_fieldofstudyhelp5(inputs)
	return ar_developerportal_credentialbuilder_achievement_fieldofstudyhelp5(inputs)
});
export { developerportal_credentialbuilder_achievement_fieldofstudyhelp5 as "developerPortal.credentialBuilder.achievement.fieldOfStudyHelp" }