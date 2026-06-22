/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Relationshiptype3Inputs */

const en_developerportal_credentialbuilder_associations_relationshiptype3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Relationshiptype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relationship Type`)
};

const es_developerportal_credentialbuilder_associations_relationshiptype3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Relationshiptype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo de Relación`)
};

const fr_developerportal_credentialbuilder_associations_relationshiptype3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Relationshiptype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type de Relation`)
};

const ar_developerportal_credentialbuilder_associations_relationshiptype3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Relationshiptype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع العلاقة`)
};

/**
* | output |
* | --- |
* | "Relationship Type" |
*
* @param {Developerportal_Credentialbuilder_Associations_Relationshiptype3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_relationshiptype3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Relationshiptype3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Relationshiptype3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_relationshiptype3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_relationshiptype3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_relationshiptype3(inputs)
	return ar_developerportal_credentialbuilder_associations_relationshiptype3(inputs)
});
export { developerportal_credentialbuilder_associations_relationshiptype3 as "developerPortal.credentialBuilder.associations.relationshipType" }