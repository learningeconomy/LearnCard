/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Addvcs_Title5Inputs */

const en_passport_buildmylearncard_addvcs_title5 = /** @type {(inputs: Passport_Buildmylearncard_Addvcs_Title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Verifiable Credentials`)
};

const es_passport_buildmylearncard_addvcs_title5 = /** @type {(inputs: Passport_Buildmylearncard_Addvcs_Title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar credenciales verificables`)
};

const fr_passport_buildmylearncard_addvcs_title5 = /** @type {(inputs: Passport_Buildmylearncard_Addvcs_Title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter des justificatifs vérifiables`)
};

const ar_passport_buildmylearncard_addvcs_title5 = /** @type {(inputs: Passport_Buildmylearncard_Addvcs_Title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة بيانات اعتماد قابلة للتحقق`)
};

/**
* | output |
* | --- |
* | "Add Verifiable Credentials" |
*
* @param {Passport_Buildmylearncard_Addvcs_Title5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_addvcs_title5 = /** @type {((inputs?: Passport_Buildmylearncard_Addvcs_Title5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Addvcs_Title5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_addvcs_title5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_addvcs_title5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_addvcs_title5(inputs)
	return ar_passport_buildmylearncard_addvcs_title5(inputs)
});
export { passport_buildmylearncard_addvcs_title5 as "passport.buildMyLearnCard.addVCs.title" }