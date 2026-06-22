/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Customfields_Fieldvalueplaceholder5Inputs */

const en_developerportal_credentialbuilder_customfields_fieldvalueplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldvalueplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Value or leave empty for dynamic`)
};

const es_developerportal_credentialbuilder_customfields_fieldvalueplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldvalueplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valor o déjalo vacío para dinámico`)
};

const fr_developerportal_credentialbuilder_customfields_fieldvalueplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldvalueplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valeur ou laissez vide pour dynamique`)
};

const ar_developerportal_credentialbuilder_customfields_fieldvalueplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Fieldvalueplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`القيمة أو اتركه فارغًا للديناميكي`)
};

/**
* | output |
* | --- |
* | "Value or leave empty for dynamic" |
*
* @param {Developerportal_Credentialbuilder_Customfields_Fieldvalueplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_customfields_fieldvalueplaceholder5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Customfields_Fieldvalueplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Customfields_Fieldvalueplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_customfields_fieldvalueplaceholder5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_customfields_fieldvalueplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_customfields_fieldvalueplaceholder5(inputs)
	return ar_developerportal_credentialbuilder_customfields_fieldvalueplaceholder5(inputs)
});
export { developerportal_credentialbuilder_customfields_fieldvalueplaceholder5 as "developerPortal.credentialBuilder.customFields.fieldValuePlaceholder" }