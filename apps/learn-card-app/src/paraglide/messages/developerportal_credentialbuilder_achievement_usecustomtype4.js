/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Usecustomtype4Inputs */

const en_developerportal_credentialbuilder_achievement_usecustomtype4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Usecustomtype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use custom type to target a specific wallet folder`)
};

const es_developerportal_credentialbuilder_achievement_usecustomtype4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Usecustomtype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar tipo personalizado para apuntar a una carpeta específica en la cartera`)
};

const fr_developerportal_credentialbuilder_achievement_usecustomtype4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Usecustomtype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser un type personnalisé pour cibler un dossier spécifique du portefeuille`)
};

const ar_developerportal_credentialbuilder_achievement_usecustomtype4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Usecustomtype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم نوعًا مخصصًا لاستهداف مجلد معين في المحفظة`)
};

/**
* | output |
* | --- |
* | "Use custom type to target a specific wallet folder" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Usecustomtype4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_usecustomtype4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Usecustomtype4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Usecustomtype4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_usecustomtype4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_usecustomtype4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_usecustomtype4(inputs)
	return ar_developerportal_credentialbuilder_achievement_usecustomtype4(inputs)
});
export { developerportal_credentialbuilder_achievement_usecustomtype4 as "developerPortal.credentialBuilder.achievement.useCustomType" }