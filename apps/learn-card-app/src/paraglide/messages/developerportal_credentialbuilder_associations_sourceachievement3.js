/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Sourceachievement3Inputs */

const en_developerportal_credentialbuilder_associations_sourceachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Sourceachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source Achievement`)
};

const es_developerportal_credentialbuilder_associations_sourceachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Sourceachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logro Origen`)
};

const fr_developerportal_credentialbuilder_associations_sourceachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Sourceachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisation Source`)
};

const ar_developerportal_credentialbuilder_associations_sourceachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Sourceachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجاز المصدر`)
};

/**
* | output |
* | --- |
* | "Source Achievement" |
*
* @param {Developerportal_Credentialbuilder_Associations_Sourceachievement3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_sourceachievement3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Sourceachievement3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Sourceachievement3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_sourceachievement3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_sourceachievement3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_sourceachievement3(inputs)
	return ar_developerportal_credentialbuilder_associations_sourceachievement3(inputs)
});
export { developerportal_credentialbuilder_associations_sourceachievement3 as "developerPortal.credentialBuilder.associations.sourceAchievement" }