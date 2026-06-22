/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Credentialname5Inputs */

const en_passport_buildmylearncard_editview_credentialname5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Credentialname5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Name`)
};

const es_passport_buildmylearncard_editview_credentialname5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Credentialname5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de la credencial`)
};

const fr_passport_buildmylearncard_editview_credentialname5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Credentialname5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du justificatif`)
};

const ar_passport_buildmylearncard_editview_credentialname5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Credentialname5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم بيان الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential Name" |
*
* @param {Passport_Buildmylearncard_Editview_Credentialname5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_credentialname5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Credentialname5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Credentialname5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_credentialname5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_credentialname5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_credentialname5(inputs)
	return ar_passport_buildmylearncard_editview_credentialname5(inputs)
});
export { passport_buildmylearncard_editview_credentialname5 as "passport.buildMyLearnCard.editView.credentialName" }