/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Ctidhelp3Inputs */

const en_developerportal_credentialbuilder_achievement_ctidhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctidhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Engine Registry ID — links to Credential Finder`)
};

const es_developerportal_credentialbuilder_achievement_ctidhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctidhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID del Registro de Credenciales — enlaza a Credential Finder`)
};

const fr_developerportal_credentialbuilder_achievement_ctidhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctidhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID du Registre des Crédentials — lien vers Credential Finder`)
};

const ar_developerportal_credentialbuilder_achievement_ctidhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Ctidhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف سجل محرك الاعتماد — رابط إلى Credential Finder`)
};

/**
* | output |
* | --- |
* | "Credential Engine Registry ID — links to Credential Finder" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Ctidhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_ctidhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Ctidhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Ctidhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_ctidhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_ctidhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_ctidhelp3(inputs)
	return ar_developerportal_credentialbuilder_achievement_ctidhelp3(inputs)
});
export { developerportal_credentialbuilder_achievement_ctidhelp3 as "developerPortal.credentialBuilder.achievement.ctidHelp" }