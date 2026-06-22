/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Selectachievement3Inputs */

const en_developerportal_credentialbuilder_associations_selectachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Selectachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select achievement...`)
};

const es_developerportal_credentialbuilder_associations_selectachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Selectachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar logro...`)
};

const fr_developerportal_credentialbuilder_associations_selectachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Selectachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner une réalisation...`)
};

const ar_developerportal_credentialbuilder_associations_selectachievement3 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Selectachievement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر إنجازًا...`)
};

/**
* | output |
* | --- |
* | "Select achievement..." |
*
* @param {Developerportal_Credentialbuilder_Associations_Selectachievement3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_selectachievement3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Selectachievement3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Selectachievement3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_selectachievement3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_selectachievement3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_selectachievement3(inputs)
	return ar_developerportal_credentialbuilder_associations_selectachievement3(inputs)
});
export { developerportal_credentialbuilder_associations_selectachievement3 as "developerPortal.credentialBuilder.associations.selectAchievement" }