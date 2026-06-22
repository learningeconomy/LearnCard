/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Fieldofstudy4Inputs */

const en_developerportal_credentialbuilder_achievement_fieldofstudy4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudy4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Field of Study`)
};

const es_developerportal_credentialbuilder_achievement_fieldofstudy4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudy4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Campo de Estudio`)
};

const fr_developerportal_credentialbuilder_achievement_fieldofstudy4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudy4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Domaine d'Étude`)
};

const ar_developerportal_credentialbuilder_achievement_fieldofstudy4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Fieldofstudy4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مجال الدراسة`)
};

/**
* | output |
* | --- |
* | "Field of Study" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Fieldofstudy4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_fieldofstudy4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Fieldofstudy4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Fieldofstudy4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_fieldofstudy4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_fieldofstudy4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_fieldofstudy4(inputs)
	return ar_developerportal_credentialbuilder_achievement_fieldofstudy4(inputs)
});
export { developerportal_credentialbuilder_achievement_fieldofstudy4 as "developerPortal.credentialBuilder.achievement.fieldOfStudy" }