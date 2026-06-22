/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Fieldeditor_Uploadimage4Inputs */

const en_developerportal_credentialbuilder_fieldeditor_uploadimage4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Uploadimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload image`)
};

const es_developerportal_credentialbuilder_fieldeditor_uploadimage4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Uploadimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir imagen`)
};

const fr_developerportal_credentialbuilder_fieldeditor_uploadimage4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Uploadimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger une image`)
};

const ar_developerportal_credentialbuilder_fieldeditor_uploadimage4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Uploadimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع صورة`)
};

/**
* | output |
* | --- |
* | "Upload image" |
*
* @param {Developerportal_Credentialbuilder_Fieldeditor_Uploadimage4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_fieldeditor_uploadimage4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Fieldeditor_Uploadimage4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Fieldeditor_Uploadimage4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_fieldeditor_uploadimage4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_fieldeditor_uploadimage4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_fieldeditor_uploadimage4(inputs)
	return ar_developerportal_credentialbuilder_fieldeditor_uploadimage4(inputs)
});
export { developerportal_credentialbuilder_fieldeditor_uploadimage4 as "developerPortal.credentialBuilder.fieldEditor.uploadImage" }