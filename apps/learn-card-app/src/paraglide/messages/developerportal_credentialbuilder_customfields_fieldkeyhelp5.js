/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Customfields_Fieldkeyhelp5Inputs */

const en_developerportal_credentialbuilder_customfields_fieldkeyhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkeyhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The key name in the extensions object`)
};

const es_developerportal_credentialbuilder_customfields_fieldkeyhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkeyhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El nombre de la clave en el objeto de extensiones`)
};

const fr_developerportal_credentialbuilder_customfields_fieldkeyhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkeyhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le nom de la clé dans l'objet d'extensions`)
};

const ar_developerportal_credentialbuilder_customfields_fieldkeyhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkeyhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المفتاح في كائن الملحقات`)
};

/**
* | output |
* | --- |
* | "The key name in the extensions object" |
*
* @param {Developerportal_Credentialbuilder_Customfields_Fieldkeyhelp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_customfields_fieldkeyhelp5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Customfields_Fieldkeyhelp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Customfields_Fieldkeyhelp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_customfields_fieldkeyhelp5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_customfields_fieldkeyhelp5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_customfields_fieldkeyhelp5(inputs)
	return ar_developerportal_credentialbuilder_customfields_fieldkeyhelp5(inputs)
});
export { developerportal_credentialbuilder_customfields_fieldkeyhelp5 as "developerPortal.credentialBuilder.customFields.fieldKeyHelp" }