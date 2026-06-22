/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Customfields_Fieldvaluehelp5Inputs */

const en_developerportal_credentialbuilder_customfields_fieldvaluehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldvaluehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The value for this field`)
};

const es_developerportal_credentialbuilder_customfields_fieldvaluehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldvaluehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El valor para este campo`)
};

const fr_developerportal_credentialbuilder_customfields_fieldvaluehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldvaluehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La valeur pour ce champ`)
};

const ar_developerportal_credentialbuilder_customfields_fieldvaluehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldvaluehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`القيمة لهذا الحقل`)
};

/**
* | output |
* | --- |
* | "The value for this field" |
*
* @param {Developerportal_Credentialbuilder_Customfields_Fieldvaluehelp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_customfields_fieldvaluehelp5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Customfields_Fieldvaluehelp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Customfields_Fieldvaluehelp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_customfields_fieldvaluehelp5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_customfields_fieldvaluehelp5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_customfields_fieldvaluehelp5(inputs)
	return ar_developerportal_credentialbuilder_customfields_fieldvaluehelp5(inputs)
});
export { developerportal_credentialbuilder_customfields_fieldvaluehelp5 as "developerPortal.credentialBuilder.customFields.fieldValueHelp" }