/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Toastextractfailed5Inputs */

const en_passport_buildmylearncard_managers_toastextractfailed5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastextractfailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not extract credentials`)
};

const es_passport_buildmylearncard_managers_toastextractfailed5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastextractfailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudieron extraer credenciales`)
};

const fr_passport_buildmylearncard_managers_toastextractfailed5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastextractfailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'extraire les credentials`)
};

const ar_passport_buildmylearncard_managers_toastextractfailed5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Toastextractfailed5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر استخراج الشهادات`)
};

/**
* | output |
* | --- |
* | "Could not extract credentials" |
*
* @param {Passport_Buildmylearncard_Managers_Toastextractfailed5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_toastextractfailed5 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Toastextractfailed5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Toastextractfailed5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_toastextractfailed5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_toastextractfailed5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_toastextractfailed5(inputs)
	return ar_passport_buildmylearncard_managers_toastextractfailed5(inputs)
});
export { passport_buildmylearncard_managers_toastextractfailed5 as "passport.buildMyLearnCard.managers.toastExtractFailed" }