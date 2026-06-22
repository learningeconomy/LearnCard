/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Targetachievement3Inputs */

const en_developerportal_credentialbuilder_associations_targetachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Targetachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Target Achievement`)
};

const es_developerportal_credentialbuilder_associations_targetachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Targetachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logro Destino`)
};

const fr_developerportal_credentialbuilder_associations_targetachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Targetachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisation Cible`)
};

const ar_developerportal_credentialbuilder_associations_targetachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Targetachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجاز الهدف`)
};

/**
* | output |
* | --- |
* | "Target Achievement" |
*
* @param {Developerportal_Credentialbuilder_Associations_Targetachievement3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_targetachievement3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Targetachievement3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Targetachievement3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_targetachievement3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_targetachievement3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_targetachievement3(inputs)
	return ar_developerportal_credentialbuilder_associations_targetachievement3(inputs)
});
export { developerportal_credentialbuilder_associations_targetachievement3 as "developerPortal.credentialBuilder.associations.targetAchievement" }