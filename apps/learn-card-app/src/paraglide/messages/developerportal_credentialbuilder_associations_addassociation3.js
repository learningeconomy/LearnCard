/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Addassociation3Inputs */

const en_developerportal_credentialbuilder_associations_addassociation3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Addassociation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Association`)
};

const es_developerportal_credentialbuilder_associations_addassociation3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Addassociation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Asociación`)
};

const fr_developerportal_credentialbuilder_associations_addassociation3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Addassociation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une Association`)
};

const ar_developerportal_credentialbuilder_associations_addassociation3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Addassociation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة ارتباط`)
};

/**
* | output |
* | --- |
* | "Add Association" |
*
* @param {Developerportal_Credentialbuilder_Associations_Addassociation3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_addassociation3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Addassociation3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Addassociation3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_addassociation3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_addassociation3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_addassociation3(inputs)
	return ar_developerportal_credentialbuilder_associations_addassociation3(inputs)
});
export { developerportal_credentialbuilder_associations_addassociation3 as "developerPortal.credentialBuilder.associations.addAssociation" }