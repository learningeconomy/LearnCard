/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ summary: NonNullable<unknown>, suggestions: NonNullable<unknown> }} Developerportal_Credentialbuilder_Validate_Tooltip_Invalidwithsuggestions4Inputs */

const en_developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidwithsuggestions4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.summary}

Suggestions:
• ${i?.suggestions}`)
};

const es_developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidwithsuggestions4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.summary}

Suggestions:
• ${i?.suggestions}`)
};

const fr_developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidwithsuggestions4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.summary}

Suggestions:
• ${i?.suggestions}`)
};

const ar_developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidwithsuggestions4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.summary}

Suggestions:
• ${i?.suggestions}`)
};

/**
* | output |
* | --- |
* | "{summary} Suggestions: • {suggestions}" |
*
* @param {Developerportal_Credentialbuilder_Validate_Tooltip_Invalidwithsuggestions4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4 = /** @type {((inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidwithsuggestions4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validate_Tooltip_Invalidwithsuggestions4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4(inputs)
	return ar_developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4(inputs)
});
export { developerportal_credentialbuilder_validate_tooltip_invalidwithsuggestions4 as "developerPortal.credentialBuilder.validate.tooltip.invalidWithSuggestions" }