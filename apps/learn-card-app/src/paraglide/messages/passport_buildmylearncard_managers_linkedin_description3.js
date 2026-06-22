/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Linkedin_Description3Inputs */

const en_passport_buildmylearncard_managers_linkedin_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Linkedin_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect your professional network to autofill work history and skills.`)
};

const es_passport_buildmylearncard_managers_linkedin_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Linkedin_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conecta tu red profesional para autocompletar tu experiencia laboral y habilidades.`)
};

const fr_passport_buildmylearncard_managers_linkedin_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Linkedin_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez votre réseau professionnel pour remplir automatiquement votre expérience et vos compétences.`)
};

const ar_passport_buildmylearncard_managers_linkedin_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Linkedin_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اربط شبكتك المهنية لملء سجل العمل والمهارات تلقائياً.`)
};

/**
* | output |
* | --- |
* | "Connect your professional network to autofill work history and skills." |
*
* @param {Passport_Buildmylearncard_Managers_Linkedin_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_linkedin_description3 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Linkedin_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Linkedin_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_linkedin_description3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_linkedin_description3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_linkedin_description3(inputs)
	return ar_passport_buildmylearncard_managers_linkedin_description3(inputs)
});
export { passport_buildmylearncard_managers_linkedin_description3 as "passport.buildMyLearnCard.managers.linkedin.description" }