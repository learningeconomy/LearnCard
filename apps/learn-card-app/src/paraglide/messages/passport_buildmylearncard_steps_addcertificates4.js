/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Steps_Addcertificates4Inputs */

const en_passport_buildmylearncard_steps_addcertificates4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addcertificates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Certificates`)
};

const es_passport_buildmylearncard_steps_addcertificates4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addcertificates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar certificados`)
};

const fr_passport_buildmylearncard_steps_addcertificates4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addcertificates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter des certificats`)
};

const ar_passport_buildmylearncard_steps_addcertificates4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addcertificates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة شهادات`)
};

/**
* | output |
* | --- |
* | "Add Certificates" |
*
* @param {Passport_Buildmylearncard_Steps_Addcertificates4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_steps_addcertificates4 = /** @type {((inputs?: Passport_Buildmylearncard_Steps_Addcertificates4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Steps_Addcertificates4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_steps_addcertificates4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_steps_addcertificates4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_steps_addcertificates4(inputs)
	return ar_passport_buildmylearncard_steps_addcertificates4(inputs)
});
export { passport_buildmylearncard_steps_addcertificates4 as "passport.buildMyLearnCard.steps.addCertificates" }