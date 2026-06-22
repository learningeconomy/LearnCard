/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Schools_Description3Inputs */

const en_passport_buildmylearncard_managers_schools_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Schools_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync academic history with your LearnCard.`)
};

const es_passport_buildmylearncard_managers_schools_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Schools_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincroniza tu historial académico con tu LearnCard.`)
};

const fr_passport_buildmylearncard_managers_schools_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Schools_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisez votre parcours scolaire avec votre LearnCard.`)
};

const ar_passport_buildmylearncard_managers_schools_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Schools_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`زامن سجلك الأكاديمي مع LearnCard.`)
};

/**
* | output |
* | --- |
* | "Sync academic history with your LearnCard." |
*
* @param {Passport_Buildmylearncard_Managers_Schools_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_schools_description3 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Schools_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Schools_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_schools_description3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_schools_description3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_schools_description3(inputs)
	return ar_passport_buildmylearncard_managers_schools_description3(inputs)
});
export { passport_buildmylearncard_managers_schools_description3 as "passport.buildMyLearnCard.managers.schools.description" }