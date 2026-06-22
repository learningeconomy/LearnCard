/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Targetframeworkhelp4Inputs */

const en_developerportal_credentialbuilder_achievement_targetframeworkhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframeworkhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name of the framework`)
};

const es_developerportal_credentialbuilder_achievement_targetframeworkhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframeworkhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del marco`)
};

const fr_developerportal_credentialbuilder_achievement_targetframeworkhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframeworkhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du cadre`)
};

const ar_developerportal_credentialbuilder_achievement_targetframeworkhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Targetframeworkhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الإطار`)
};

/**
* | output |
* | --- |
* | "Name of the framework" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Targetframeworkhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_targetframeworkhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Targetframeworkhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Targetframeworkhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_targetframeworkhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_targetframeworkhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_targetframeworkhelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_targetframeworkhelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_targetframeworkhelp4 as "developerPortal.credentialBuilder.achievement.targetFrameworkHelp" }