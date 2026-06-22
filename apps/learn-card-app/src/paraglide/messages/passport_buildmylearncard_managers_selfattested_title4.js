/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Selfattested_Title4Inputs */

const en_passport_buildmylearncard_managers_selfattested_title4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self-Attested Skills`)
};

const es_passport_buildmylearncard_managers_selfattested_title4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades autodeclaradas`)
};

const fr_passport_buildmylearncard_managers_selfattested_title4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences auto-déclarées`)
};

const ar_passport_buildmylearncard_managers_selfattested_title4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات المُقَرّة ذاتياً`)
};

/**
* | output |
* | --- |
* | "Self-Attested Skills" |
*
* @param {Passport_Buildmylearncard_Managers_Selfattested_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_selfattested_title4 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Selfattested_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Selfattested_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_selfattested_title4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_selfattested_title4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_selfattested_title4(inputs)
	return ar_passport_buildmylearncard_managers_selfattested_title4(inputs)
});
export { passport_buildmylearncard_managers_selfattested_title4 as "passport.buildMyLearnCard.managers.selfAttested.title" }