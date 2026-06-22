/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Fieldeditor_Select3Inputs */

const en_developerportal_credentialbuilder_fieldeditor_select3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Select3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select...`)
};

const es_developerportal_credentialbuilder_fieldeditor_select3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Select3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar...`)
};

const fr_developerportal_credentialbuilder_fieldeditor_select3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Select3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner...`)
};

const ar_developerportal_credentialbuilder_fieldeditor_select3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Select3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار...`)
};

/**
* | output |
* | --- |
* | "Select..." |
*
* @param {Developerportal_Credentialbuilder_Fieldeditor_Select3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_fieldeditor_select3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Fieldeditor_Select3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Fieldeditor_Select3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_fieldeditor_select3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_fieldeditor_select3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_fieldeditor_select3(inputs)
	return ar_developerportal_credentialbuilder_fieldeditor_select3(inputs)
});
export { developerportal_credentialbuilder_fieldeditor_select3 as "developerPortal.credentialBuilder.fieldEditor.select" }