/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Rawvc_Addbutton6Inputs */

const en_passport_buildmylearncard_managers_rawvc_addbutton6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Addbutton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Credentials`)
};

const es_passport_buildmylearncard_managers_rawvc_addbutton6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Addbutton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir credenciales`)
};

const fr_passport_buildmylearncard_managers_rawvc_addbutton6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Addbutton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter des justificatifs`)
};

const ar_passport_buildmylearncard_managers_rawvc_addbutton6 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Addbutton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة بيانات اعتماد`)
};

/**
* | output |
* | --- |
* | "Add Credentials" |
*
* @param {Passport_Buildmylearncard_Managers_Rawvc_Addbutton6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_rawvc_addbutton6 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Rawvc_Addbutton6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Rawvc_Addbutton6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_rawvc_addbutton6(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_rawvc_addbutton6(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_rawvc_addbutton6(inputs)
	return ar_passport_buildmylearncard_managers_rawvc_addbutton6(inputs)
});
export { passport_buildmylearncard_managers_rawvc_addbutton6 as "passport.buildMyLearnCard.managers.rawVC.addButton" }