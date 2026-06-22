/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Fieldeditor_Makestatic4Inputs */

const en_developerportal_credentialbuilder_fieldeditor_makestatic4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Makestatic4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Click to make static`)
};

const es_developerportal_credentialbuilder_fieldeditor_makestatic4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Makestatic4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz clic para hacer estático`)
};

const fr_developerportal_credentialbuilder_fieldeditor_makestatic4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Makestatic4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cliquez pour rendre statique`)
};

const ar_developerportal_credentialbuilder_fieldeditor_makestatic4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Makestatic4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انقر لجعله ثابتًا`)
};

/**
* | output |
* | --- |
* | "Click to make static" |
*
* @param {Developerportal_Credentialbuilder_Fieldeditor_Makestatic4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_fieldeditor_makestatic4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Fieldeditor_Makestatic4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Fieldeditor_Makestatic4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_fieldeditor_makestatic4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_fieldeditor_makestatic4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_fieldeditor_makestatic4(inputs)
	return ar_developerportal_credentialbuilder_fieldeditor_makestatic4(inputs)
});
export { developerportal_credentialbuilder_fieldeditor_makestatic4 as "developerPortal.credentialBuilder.fieldEditor.makeStatic" }