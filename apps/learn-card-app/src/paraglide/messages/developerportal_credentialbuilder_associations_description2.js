/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Description2Inputs */

const en_developerportal_credentialbuilder_associations_description2 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Define relationships between achievements (e.g., a course is a child of a program)`)
};

const es_developerportal_credentialbuilder_associations_description2 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Define relaciones entre logros (ej., un curso es hijo de un programa)`)
};

const fr_developerportal_credentialbuilder_associations_description2 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définissez des relations entre les réalisations (ex., un cours est un enfant d'un programme)`)
};

const ar_developerportal_credentialbuilder_associations_description2 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد العلاقات بين الإنجازات (مثال: المقرر هو فرع من البرنامج)`)
};

/**
* | output |
* | --- |
* | "Define relationships between achievements (e.g., a course is a child of a program)" |
*
* @param {Developerportal_Credentialbuilder_Associations_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_description2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_description2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_description2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_description2(inputs)
	return ar_developerportal_credentialbuilder_associations_description2(inputs)
});
export { developerportal_credentialbuilder_associations_description2 as "developerPortal.credentialBuilder.associations.description" }