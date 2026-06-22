/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Someerrors3Inputs */

const en_developerportal_credentialbuilder_associations_someerrors3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Someerrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some associations have invalid references`)
};

const es_developerportal_credentialbuilder_associations_someerrors3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Someerrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algunas asociaciones tienen referencias inválidas`)
};

const fr_developerportal_credentialbuilder_associations_someerrors3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Someerrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certaines associations ont des références invalides`)
};

const ar_developerportal_credentialbuilder_associations_someerrors3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Someerrors3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعض الارتباطات بها مراجع غير صالحة`)
};

/**
* | output |
* | --- |
* | "Some associations have invalid references" |
*
* @param {Developerportal_Credentialbuilder_Associations_Someerrors3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_someerrors3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Someerrors3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Someerrors3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_someerrors3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_someerrors3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_someerrors3(inputs)
	return ar_developerportal_credentialbuilder_associations_someerrors3(inputs)
});
export { developerportal_credentialbuilder_associations_someerrors3 as "developerPortal.credentialBuilder.associations.someErrors" }