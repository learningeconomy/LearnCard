/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Addbutton4Inputs */

const en_passport_buildmylearncard_managers_addbutton4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Addbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add`)
};

const es_passport_buildmylearncard_managers_addbutton4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Addbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir`)
};

const fr_passport_buildmylearncard_managers_addbutton4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Addbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter`)
};

const ar_passport_buildmylearncard_managers_addbutton4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Addbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة`)
};

/**
* | output |
* | --- |
* | "Add" |
*
* @param {Passport_Buildmylearncard_Managers_Addbutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_addbutton4 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Addbutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Addbutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_addbutton4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_addbutton4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_addbutton4(inputs)
	return ar_passport_buildmylearncard_managers_addbutton4(inputs)
});
export { passport_buildmylearncard_managers_addbutton4 as "passport.buildMyLearnCard.managers.addButton" }