/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Customfields_Fieldkey4Inputs */

const en_developerportal_credentialbuilder_customfields_fieldkey4 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkey4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Field Key`)
};

const es_developerportal_credentialbuilder_customfields_fieldkey4 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkey4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave del Campo`)
};

const fr_developerportal_credentialbuilder_customfields_fieldkey4 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkey4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé du Champ`)
};

const ar_developerportal_credentialbuilder_customfields_fieldkey4 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldkey4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح الحقل`)
};

/**
* | output |
* | --- |
* | "Field Key" |
*
* @param {Developerportal_Credentialbuilder_Customfields_Fieldkey4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_customfields_fieldkey4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Customfields_Fieldkey4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Customfields_Fieldkey4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_customfields_fieldkey4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_customfields_fieldkey4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_customfields_fieldkey4(inputs)
	return ar_developerportal_credentialbuilder_customfields_fieldkey4(inputs)
});
export { developerportal_credentialbuilder_customfields_fieldkey4 as "developerPortal.credentialBuilder.customFields.fieldKey" }