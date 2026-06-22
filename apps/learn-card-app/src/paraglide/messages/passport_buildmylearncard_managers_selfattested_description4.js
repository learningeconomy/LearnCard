/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Selfattested_Description4Inputs */

const en_passport_buildmylearncard_managers_selfattested_description4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select from suggested skills based on your profile or add your own.`)
};

const es_passport_buildmylearncard_managers_selfattested_description4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona habilidades sugeridas según tu perfil o añade las tuyas.`)
};

const fr_passport_buildmylearncard_managers_selfattested_description4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez parmi les compétences suggérées selon votre profil ou ajoutez les vôtres.`)
};

const ar_passport_buildmylearncard_managers_selfattested_description4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر من المهارات المقترحة بناءً على ملفك أو أضف مهاراتك.`)
};

/**
* | output |
* | --- |
* | "Select from suggested skills based on your profile or add your own." |
*
* @param {Passport_Buildmylearncard_Managers_Selfattested_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_selfattested_description4 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Selfattested_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Selfattested_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_selfattested_description4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_selfattested_description4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_selfattested_description4(inputs)
	return ar_passport_buildmylearncard_managers_selfattested_description4(inputs)
});
export { passport_buildmylearncard_managers_selfattested_description4 as "passport.buildMyLearnCard.managers.selfAttested.description" }