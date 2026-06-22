/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Customfields_Fieldkeyplaceholder5Inputs */

const en_developerportal_credentialbuilder_customfields_fieldkeyplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkeyplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`fieldKey`)
};

const es_developerportal_credentialbuilder_customfields_fieldkeyplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkeyplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`fieldKey`)
};

const fr_developerportal_credentialbuilder_customfields_fieldkeyplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkeyplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`fieldKey`)
};

const ar_developerportal_credentialbuilder_customfields_fieldkeyplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkeyplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`fieldKey`)
};

/**
* | output |
* | --- |
* | "fieldKey" |
*
* @param {Developerportal_Credentialbuilder_Customfields_Fieldkeyplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_customfields_fieldkeyplaceholder5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Customfields_Fieldkeyplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Customfields_Fieldkeyplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_customfields_fieldkeyplaceholder5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_customfields_fieldkeyplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_customfields_fieldkeyplaceholder5(inputs)
	return ar_developerportal_credentialbuilder_customfields_fieldkeyplaceholder5(inputs)
});
export { developerportal_credentialbuilder_customfields_fieldkeyplaceholder5 as "developerPortal.credentialBuilder.customFields.fieldKeyPlaceholder" }