/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Confirmremove_Resume4Inputs */

const en_passport_buildmylearncard_managers_confirmremove_resume4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Confirmremove_Resume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want remove your uploaded resume?`)
};

const es_passport_buildmylearncard_managers_confirmremove_resume4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Confirmremove_Resume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres eliminar tu currículum subido?`)
};

const fr_passport_buildmylearncard_managers_confirmremove_resume4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Confirmremove_Resume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer votre CV téléversé ?`)
};

const ar_passport_buildmylearncard_managers_confirmremove_resume4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Confirmremove_Resume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد من إزالة سيرتك الذاتية المرفوعة؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want remove your uploaded resume?" |
*
* @param {Passport_Buildmylearncard_Managers_Confirmremove_Resume4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_confirmremove_resume4 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Confirmremove_Resume4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Confirmremove_Resume4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_confirmremove_resume4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_confirmremove_resume4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_confirmremove_resume4(inputs)
	return ar_passport_buildmylearncard_managers_confirmremove_resume4(inputs)
});
export { passport_buildmylearncard_managers_confirmremove_resume4 as "passport.buildMyLearnCard.managers.confirmRemove.resume" }