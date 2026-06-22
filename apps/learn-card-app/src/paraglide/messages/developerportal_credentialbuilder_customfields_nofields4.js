/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Customfields_Nofields4Inputs */

const en_developerportal_credentialbuilder_customfields_nofields4 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Nofields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No custom fields added`)
};

const es_developerportal_credentialbuilder_customfields_nofields4 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Nofields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin campos personalizados añadidos`)
};

const fr_developerportal_credentialbuilder_customfields_nofields4 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Nofields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun champ personnalisé ajouté`)
};

const ar_developerportal_credentialbuilder_customfields_nofields4 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Nofields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة حقول مخصصة`)
};

/**
* | output |
* | --- |
* | "No custom fields added" |
*
* @param {Developerportal_Credentialbuilder_Customfields_Nofields4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_customfields_nofields4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Customfields_Nofields4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Customfields_Nofields4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_customfields_nofields4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_customfields_nofields4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_customfields_nofields4(inputs)
	return ar_developerportal_credentialbuilder_customfields_nofields4(inputs)
});
export { developerportal_credentialbuilder_customfields_nofields4 as "developerPortal.credentialBuilder.customFields.noFields" }