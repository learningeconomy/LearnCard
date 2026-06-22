/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ n: NonNullable<unknown> }} Developerportal_Credentialbuilder_Associations_Associationnumber3Inputs */

const en_developerportal_credentialbuilder_associations_associationnumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Associationnumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Association ${i?.n}`)
};

const es_developerportal_credentialbuilder_associations_associationnumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Associationnumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Asociación ${i?.n}`)
};

const fr_developerportal_credentialbuilder_associations_associationnumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Associationnumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Association ${i?.n}`)
};

const ar_developerportal_credentialbuilder_associations_associationnumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Associationnumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ارتباط ${i?.n}`)
};

/**
* | output |
* | --- |
* | "Association {n}" |
*
* @param {Developerportal_Credentialbuilder_Associations_Associationnumber3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_associationnumber3 = /** @type {((inputs: Developerportal_Credentialbuilder_Associations_Associationnumber3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Associationnumber3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_associationnumber3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_associationnumber3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_associationnumber3(inputs)
	return ar_developerportal_credentialbuilder_associations_associationnumber3(inputs)
});
export { developerportal_credentialbuilder_associations_associationnumber3 as "developerPortal.credentialBuilder.associations.associationNumber" }