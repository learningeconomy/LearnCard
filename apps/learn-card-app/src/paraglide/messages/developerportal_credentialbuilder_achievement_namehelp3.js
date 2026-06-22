/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Namehelp3Inputs */

const en_developerportal_credentialbuilder_achievement_namehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Namehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The name of the achievement being recognized`)
};

const es_developerportal_credentialbuilder_achievement_namehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Namehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El nombre del logro que se reconoce`)
};

const fr_developerportal_credentialbuilder_achievement_namehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Namehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le nom de la réalisation reconnue`)
};

const ar_developerportal_credentialbuilder_achievement_namehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Namehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الإنجاز الذي يتم الاعتراف به`)
};

/**
* | output |
* | --- |
* | "The name of the achievement being recognized" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Namehelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_namehelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Namehelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Namehelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_namehelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_namehelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_namehelp3(inputs)
	return ar_developerportal_credentialbuilder_achievement_namehelp3(inputs)
});
export { developerportal_credentialbuilder_achievement_namehelp3 as "developerPortal.credentialBuilder.achievement.nameHelp" }