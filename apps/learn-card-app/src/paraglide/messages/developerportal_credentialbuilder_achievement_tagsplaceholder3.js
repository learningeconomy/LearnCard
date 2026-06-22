/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Tagsplaceholder3Inputs */

const en_developerportal_credentialbuilder_achievement_tagsplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tagsplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add tag and press Enter`)
};

const es_developerportal_credentialbuilder_achievement_tagsplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tagsplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir etiqueta y presiona Enter`)
};

const fr_developerportal_credentialbuilder_achievement_tagsplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tagsplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une étiquette et appuyez sur Entrée`)
};

const ar_developerportal_credentialbuilder_achievement_tagsplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tagsplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف علامة واضغط Enter`)
};

/**
* | output |
* | --- |
* | "Add tag and press Enter" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Tagsplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_tagsplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Tagsplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Tagsplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_tagsplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_tagsplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_tagsplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_achievement_tagsplaceholder3(inputs)
});
export { developerportal_credentialbuilder_achievement_tagsplaceholder3 as "developerPortal.credentialBuilder.achievement.tagsPlaceholder" }