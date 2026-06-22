/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Credentialinfo_Image3Inputs */

const en_developerportal_credentialbuilder_credentialinfo_image3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Image3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Image`)
};

const es_developerportal_credentialbuilder_credentialinfo_image3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Image3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen de la Credencial`)
};

const fr_developerportal_credentialbuilder_credentialinfo_image3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Image3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image du Crédential`)
};

const ar_developerportal_credentialbuilder_credentialinfo_image3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Image3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential Image" |
*
* @param {Developerportal_Credentialbuilder_Credentialinfo_Image3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_credentialinfo_image3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Credentialinfo_Image3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Credentialinfo_Image3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_credentialinfo_image3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_credentialinfo_image3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_credentialinfo_image3(inputs)
	return ar_developerportal_credentialbuilder_credentialinfo_image3(inputs)
});
export { developerportal_credentialbuilder_credentialinfo_image3 as "developerPortal.credentialBuilder.credentialInfo.image" }