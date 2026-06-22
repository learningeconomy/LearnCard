/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Credentialinfo_Name3Inputs */

const en_developerportal_credentialbuilder_credentialinfo_name3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Name3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Name`)
};

const es_developerportal_credentialbuilder_credentialinfo_name3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Name3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de la Credencial`)
};

const fr_developerportal_credentialbuilder_credentialinfo_name3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Name3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Crédential`)
};

const ar_developerportal_credentialbuilder_credentialinfo_name3 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Name3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential Name" |
*
* @param {Developerportal_Credentialbuilder_Credentialinfo_Name3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_credentialinfo_name3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Credentialinfo_Name3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Credentialinfo_Name3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_credentialinfo_name3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_credentialinfo_name3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_credentialinfo_name3(inputs)
	return ar_developerportal_credentialbuilder_credentialinfo_name3(inputs)
});
export { developerportal_credentialbuilder_credentialinfo_name3 as "developerPortal.credentialBuilder.credentialInfo.name" }