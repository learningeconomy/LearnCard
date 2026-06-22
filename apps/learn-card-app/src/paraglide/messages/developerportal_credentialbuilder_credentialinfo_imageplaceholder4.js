/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Credentialinfo_Imageplaceholder4Inputs */

const en_developerportal_credentialbuilder_credentialinfo_imageplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Imageplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/credential-image.png`)
};

const es_developerportal_credentialbuilder_credentialinfo_imageplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Imageplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://ejemplo.com/imagen-credencial.png`)
};

const fr_developerportal_credentialbuilder_credentialinfo_imageplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Imageplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://exemple.com/image-credential.png`)
};

const ar_developerportal_credentialbuilder_credentialinfo_imageplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Imageplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/credential-image.png`)
};

/**
* | output |
* | --- |
* | "https://example.com/credential-image.png" |
*
* @param {Developerportal_Credentialbuilder_Credentialinfo_Imageplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_credentialinfo_imageplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Credentialinfo_Imageplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Credentialinfo_Imageplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_credentialinfo_imageplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_credentialinfo_imageplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_credentialinfo_imageplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_credentialinfo_imageplaceholder4(inputs)
});
export { developerportal_credentialbuilder_credentialinfo_imageplaceholder4 as "developerPortal.credentialBuilder.credentialInfo.imagePlaceholder" }