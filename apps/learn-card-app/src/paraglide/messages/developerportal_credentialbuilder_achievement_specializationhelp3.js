/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Specializationhelp3Inputs */

const en_developerportal_credentialbuilder_achievement_specializationhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specializationhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Area of specialization`)
};

const es_developerportal_credentialbuilder_achievement_specializationhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specializationhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Área de especialización`)
};

const fr_developerportal_credentialbuilder_achievement_specializationhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specializationhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Domaine de spécialisation`)
};

const ar_developerportal_credentialbuilder_achievement_specializationhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Specializationhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مجال التخصص`)
};

/**
* | output |
* | --- |
* | "Area of specialization" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Specializationhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_specializationhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Specializationhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Specializationhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_specializationhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_specializationhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_specializationhelp3(inputs)
	return ar_developerportal_credentialbuilder_achievement_specializationhelp3(inputs)
});
export { developerportal_credentialbuilder_achievement_specializationhelp3 as "developerPortal.credentialBuilder.achievement.specializationHelp" }