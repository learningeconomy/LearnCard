/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Noassociations3Inputs */

const en_developerportal_credentialbuilder_associations_noassociations3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Noassociations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No associations added`)
};

const es_developerportal_credentialbuilder_associations_noassociations3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Noassociations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin asociaciones añadidas`)
};

const fr_developerportal_credentialbuilder_associations_noassociations3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Noassociations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune association ajoutée`)
};

const ar_developerportal_credentialbuilder_associations_noassociations3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Noassociations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة ارتباطات`)
};

/**
* | output |
* | --- |
* | "No associations added" |
*
* @param {Developerportal_Credentialbuilder_Associations_Noassociations3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_noassociations3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Noassociations3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Noassociations3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_noassociations3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_noassociations3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_noassociations3(inputs)
	return ar_developerportal_credentialbuilder_associations_noassociations3(inputs)
});
export { developerportal_credentialbuilder_associations_noassociations3 as "developerPortal.credentialBuilder.associations.noAssociations" }