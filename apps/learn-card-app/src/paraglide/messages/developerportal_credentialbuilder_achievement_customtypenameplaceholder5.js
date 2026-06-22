/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Customtypenameplaceholder5Inputs */

const en_developerportal_credentialbuilder_achievement_customtypenameplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypenameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Team Player, Course Completion, Work Experience`)
};

const es_developerportal_credentialbuilder_achievement_customtypenameplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypenameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Jugador de Equipo, Finalización de Curso, Experiencia Laboral`)
};

const fr_developerportal_credentialbuilder_achievement_customtypenameplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypenameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Esprit d'Équipe, Fin de Cours, Expérience Professionnelle`)
};

const ar_developerportal_credentialbuilder_achievement_customtypenameplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypenameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: لاعب فريق، إكمال دورة، خبرة عمل`)
};

/**
* | output |
* | --- |
* | "e.g., Team Player, Course Completion, Work Experience" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Customtypenameplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_customtypenameplaceholder5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Customtypenameplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Customtypenameplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_customtypenameplaceholder5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_customtypenameplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_customtypenameplaceholder5(inputs)
	return ar_developerportal_credentialbuilder_achievement_customtypenameplaceholder5(inputs)
});
export { developerportal_credentialbuilder_achievement_customtypenameplaceholder5 as "developerPortal.credentialBuilder.achievement.customTypeNamePlaceholder" }