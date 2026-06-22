/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Targetnamehelp4Inputs */

const en_developerportal_credentialbuilder_achievement_targetnamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetnamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name of the framework or standard`)
};

const es_developerportal_credentialbuilder_achievement_targetnamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetnamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del marco o estándar`)
};

const fr_developerportal_credentialbuilder_achievement_targetnamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetnamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du cadre ou de la norme`)
};

const ar_developerportal_credentialbuilder_achievement_targetnamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetnamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الإطار أو المعيار`)
};

/**
* | output |
* | --- |
* | "Name of the framework or standard" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Targetnamehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_targetnamehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Targetnamehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Targetnamehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_targetnamehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_targetnamehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_targetnamehelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_targetnamehelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_targetnamehelp4 as "developerPortal.credentialBuilder.achievement.targetNameHelp" }