/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Customtypename4Inputs */

const en_developerportal_credentialbuilder_achievement_customtypename4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypename4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom Type Name`)
};

const es_developerportal_credentialbuilder_achievement_customtypename4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypename4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de Tipo Personalizado`)
};

const fr_developerportal_credentialbuilder_achievement_customtypename4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypename4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Type Personnalisé`)
};

const ar_developerportal_credentialbuilder_achievement_customtypename4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Customtypename4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم النوع المخصص`)
};

/**
* | output |
* | --- |
* | "Custom Type Name" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Customtypename4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_customtypename4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Customtypename4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Customtypename4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_customtypename4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_customtypename4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_customtypename4(inputs)
	return ar_developerportal_credentialbuilder_achievement_customtypename4(inputs)
});
export { developerportal_credentialbuilder_achievement_customtypename4 as "developerPortal.credentialBuilder.achievement.customTypeName" }