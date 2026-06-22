/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Update3Inputs */

const en_passport_buildmylearncard_managers_update3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Update3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update`)
};

const es_passport_buildmylearncard_managers_update3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Update3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar`)
};

const fr_passport_buildmylearncard_managers_update3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Update3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre à jour`)
};

const ar_passport_buildmylearncard_managers_update3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Update3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديث`)
};

/**
* | output |
* | --- |
* | "Update" |
*
* @param {Passport_Buildmylearncard_Managers_Update3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_update3 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Update3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Update3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_update3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_update3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_update3(inputs)
	return ar_passport_buildmylearncard_managers_update3(inputs)
});
export { passport_buildmylearncard_managers_update3 as "passport.buildMyLearnCard.managers.update" }