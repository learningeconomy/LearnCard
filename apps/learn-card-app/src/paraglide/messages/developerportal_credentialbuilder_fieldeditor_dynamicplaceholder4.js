/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ "{{{{var": NonNullable<unknown> }} Developerportal_Credentialbuilder_Fieldeditor_Dynamicplaceholder4Inputs */

const en_developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamicplaceholder4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Dynamic: ${i?.["{{{{var"]}}}}}`)
};

const es_developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamicplaceholder4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Dynamic: ${i?.["{{{{var"]}}}}}`)
};

const fr_developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamicplaceholder4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Dynamic: ${i?.["{{{{var"]}}}}}`)
};

const ar_developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamicplaceholder4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Dynamic: ${i?.["{{{{var"]}}}}}`)
};

/**
* | output |
* | --- |
* | "Dynamic: {{{{{var}}}}}" |
*
* @param {Developerportal_Credentialbuilder_Fieldeditor_Dynamicplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4 = /** @type {((inputs: Developerportal_Credentialbuilder_Fieldeditor_Dynamicplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Fieldeditor_Dynamicplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4(inputs)
});
export { developerportal_credentialbuilder_fieldeditor_dynamicplaceholder4 as "developerPortal.credentialBuilder.fieldEditor.dynamicPlaceholder" }