/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Rawvc_Description5Inputs */

const en_passport_buildmylearncard_managers_rawvc_description5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload or paste raw JSON credentials to add them to your wallet.`)
};

const es_passport_buildmylearncard_managers_rawvc_description5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube o pega credenciales JSON sin procesar para añadirlas a tu billetera.`)
};

const fr_passport_buildmylearncard_managers_rawvc_description5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez ou collez des justificatifs JSON bruts pour les ajouter à votre portefeuille.`)
};

const ar_passport_buildmylearncard_managers_rawvc_description5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ارفع أو الصق بيانات اعتماد JSON الأولية لإضافتها إلى محفظتك.`)
};

/**
* | output |
* | --- |
* | "Upload or paste raw JSON credentials to add them to your wallet." |
*
* @param {Passport_Buildmylearncard_Managers_Rawvc_Description5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_rawvc_description5 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Rawvc_Description5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Rawvc_Description5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_rawvc_description5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_rawvc_description5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_rawvc_description5(inputs)
	return ar_passport_buildmylearncard_managers_rawvc_description5(inputs)
});
export { passport_buildmylearncard_managers_rawvc_description5 as "passport.buildMyLearnCard.managers.rawVC.description" }