/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Fieldeditor_Static3Inputs */

const en_developerportal_credentialbuilder_fieldeditor_static3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Static3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Static`)
};

const es_developerportal_credentialbuilder_fieldeditor_static3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Static3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estático`)
};

const fr_developerportal_credentialbuilder_fieldeditor_static3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Static3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statique`)
};

const ar_developerportal_credentialbuilder_fieldeditor_static3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Static3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ثابت`)
};

/**
* | output |
* | --- |
* | "Static" |
*
* @param {Developerportal_Credentialbuilder_Fieldeditor_Static3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_fieldeditor_static3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Fieldeditor_Static3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Fieldeditor_Static3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_fieldeditor_static3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_fieldeditor_static3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_fieldeditor_static3(inputs)
	return ar_developerportal_credentialbuilder_fieldeditor_static3(inputs)
});
export { developerportal_credentialbuilder_fieldeditor_static3 as "developerPortal.credentialBuilder.fieldEditor.static" }