/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Credentialinfo_Descriptionplaceholder4Inputs */

const en_developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Descriptionplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe what this credential represents...`)
};

const es_developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Descriptionplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe lo que representa esta credencial...`)
};

const fr_developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Descriptionplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décrivez ce que représente ce crédential...`)
};

const ar_developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Descriptionplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صِف ما يمثله هذا الاعتماد...`)
};

/**
* | output |
* | --- |
* | "Describe what this credential represents..." |
*
* @param {Developerportal_Credentialbuilder_Credentialinfo_Descriptionplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Credentialinfo_Descriptionplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Credentialinfo_Descriptionplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4(inputs)
});
export { developerportal_credentialbuilder_credentialinfo_descriptionplaceholder4 as "developerPortal.credentialBuilder.credentialInfo.descriptionPlaceholder" }