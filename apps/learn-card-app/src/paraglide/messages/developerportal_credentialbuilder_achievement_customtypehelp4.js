/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Customtypehelp4Inputs */

const en_developerportal_credentialbuilder_achievement_customtypehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A descriptive name for this type of credential`)
};

const es_developerportal_credentialbuilder_achievement_customtypehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un nombre descriptivo para este tipo de credencial`)
};

const fr_developerportal_credentialbuilder_achievement_customtypehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un nom descriptif pour ce type de crédential`)
};

const ar_developerportal_credentialbuilder_achievement_customtypehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم وصفي لهذا النوع من الاعتماد`)
};

/**
* | output |
* | --- |
* | "A descriptive name for this type of credential" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Customtypehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_customtypehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Customtypehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Customtypehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_customtypehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_customtypehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_customtypehelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_customtypehelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_customtypehelp4 as "developerPortal.credentialBuilder.achievement.customTypeHelp" }