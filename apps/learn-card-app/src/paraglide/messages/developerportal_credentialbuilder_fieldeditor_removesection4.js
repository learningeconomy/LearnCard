/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Fieldeditor_Removesection4Inputs */

const en_developerportal_credentialbuilder_fieldeditor_removesection4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Removesection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove Section`)
};

const es_developerportal_credentialbuilder_fieldeditor_removesection4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Removesection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Sección`)
};

const fr_developerportal_credentialbuilder_fieldeditor_removesection4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Removesection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer la Section`)
};

const ar_developerportal_credentialbuilder_fieldeditor_removesection4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Removesection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة القسم`)
};

/**
* | output |
* | --- |
* | "Remove Section" |
*
* @param {Developerportal_Credentialbuilder_Fieldeditor_Removesection4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_fieldeditor_removesection4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Fieldeditor_Removesection4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Fieldeditor_Removesection4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_fieldeditor_removesection4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_fieldeditor_removesection4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_fieldeditor_removesection4(inputs)
	return ar_developerportal_credentialbuilder_fieldeditor_removesection4(inputs)
});
export { developerportal_credentialbuilder_fieldeditor_removesection4 as "developerPortal.credentialBuilder.fieldEditor.removeSection" }