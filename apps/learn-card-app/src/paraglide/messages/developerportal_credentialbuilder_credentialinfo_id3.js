/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Credentialinfo_Id3Inputs */

const en_developerportal_credentialbuilder_credentialinfo_id3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Id3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential ID`)
};

const es_developerportal_credentialbuilder_credentialinfo_id3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Id3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de la Credencial`)
};

const fr_developerportal_credentialbuilder_credentialinfo_id3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Id3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID du Crédential`)
};

const ar_developerportal_credentialbuilder_credentialinfo_id3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Id3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential ID" |
*
* @param {Developerportal_Credentialbuilder_Credentialinfo_Id3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_credentialinfo_id3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Credentialinfo_Id3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Credentialinfo_Id3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_credentialinfo_id3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_credentialinfo_id3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_credentialinfo_id3(inputs)
	return ar_developerportal_credentialbuilder_credentialinfo_id3(inputs)
});
export { developerportal_credentialbuilder_credentialinfo_id3 as "developerPortal.credentialBuilder.credentialInfo.id" }