/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Fieldeditor_Dynamic3Inputs */

const en_developerportal_credentialbuilder_fieldeditor_dynamic3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dynamic`)
};

const es_developerportal_credentialbuilder_fieldeditor_dynamic3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dinámico`)
};

const fr_developerportal_credentialbuilder_fieldeditor_dynamic3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dynamique`)
};

const ar_developerportal_credentialbuilder_fieldeditor_dynamic3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ديناميكي`)
};

/**
* | output |
* | --- |
* | "Dynamic" |
*
* @param {Developerportal_Credentialbuilder_Fieldeditor_Dynamic3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_fieldeditor_dynamic3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Fieldeditor_Dynamic3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Fieldeditor_Dynamic3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_fieldeditor_dynamic3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_fieldeditor_dynamic3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_fieldeditor_dynamic3(inputs)
	return ar_developerportal_credentialbuilder_fieldeditor_dynamic3(inputs)
});
export { developerportal_credentialbuilder_fieldeditor_dynamic3 as "developerPortal.credentialBuilder.fieldEditor.dynamic" }