/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validate_Tooltip_Clicktovalidate4Inputs */

const en_developerportal_credentialbuilder_validate_tooltip_clicktovalidate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Clicktovalidate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Click to validate credential`)
};

const es_developerportal_credentialbuilder_validate_tooltip_clicktovalidate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Clicktovalidate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz clic para validar el crédito`)
};

const fr_developerportal_credentialbuilder_validate_tooltip_clicktovalidate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Clicktovalidate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cliquez pour valider le crédit`)
};

const ar_developerportal_credentialbuilder_validate_tooltip_clicktovalidate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Clicktovalidate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انقر للتحقق من الاعتماد`)
};

/**
* | output |
* | --- |
* | "Click to validate credential" |
*
* @param {Developerportal_Credentialbuilder_Validate_Tooltip_Clicktovalidate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validate_tooltip_clicktovalidate4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validate_Tooltip_Clicktovalidate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validate_Tooltip_Clicktovalidate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validate_tooltip_clicktovalidate4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validate_tooltip_clicktovalidate4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validate_tooltip_clicktovalidate4(inputs)
	return ar_developerportal_credentialbuilder_validate_tooltip_clicktovalidate4(inputs)
});
export { developerportal_credentialbuilder_validate_tooltip_clicktovalidate4 as "developerPortal.credentialBuilder.validate.tooltip.clickToValidate" }