/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Addvcs_Description5Inputs */

const en_passport_buildmylearncard_addvcs_description5 = /** @type {(inputs: Passport_Buildmylearncard_Addvcs_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If you have raw JSON credentials, you can add them to your wallet here.`)
};

const es_passport_buildmylearncard_addvcs_description5 = /** @type {(inputs: Passport_Buildmylearncard_Addvcs_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si tienes credenciales en formato JSON, puedes agregarlas a tu cartera aquí.`)
};

const fr_passport_buildmylearncard_addvcs_description5 = /** @type {(inputs: Passport_Buildmylearncard_Addvcs_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si vous avez des justificatifs au format JSON brut, vous pouvez les ajouter à votre portefeuille ici.`)
};

const ar_passport_buildmylearncard_addvcs_description5 = /** @type {(inputs: Passport_Buildmylearncard_Addvcs_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إذا كان لديك بيانات اعتماد بصيغة JSON، يمكنك إضافتها إلى محفظتك هنا.`)
};

/**
* | output |
* | --- |
* | "If you have raw JSON credentials, you can add them to your wallet here." |
*
* @param {Passport_Buildmylearncard_Addvcs_Description5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_addvcs_description5 = /** @type {((inputs?: Passport_Buildmylearncard_Addvcs_Description5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Addvcs_Description5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_addvcs_description5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_addvcs_description5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_addvcs_description5(inputs)
	return ar_passport_buildmylearncard_addvcs_description5(inputs)
});
export { passport_buildmylearncard_addvcs_description5 as "passport.buildMyLearnCard.addVCs.description" }