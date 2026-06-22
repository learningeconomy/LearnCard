/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validate_Tooltip_Dirty2Inputs */

const en_developerportal_credentialbuilder_validate_tooltip_dirty2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Dirty2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changes made - validating automatically...`)
};

const es_developerportal_credentialbuilder_validate_tooltip_dirty2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Dirty2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se hicieron cambios - validando automáticamente...`)
};

const fr_developerportal_credentialbuilder_validate_tooltip_dirty2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Dirty2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifications effectuées - validation automatique...`)
};

const ar_developerportal_credentialbuilder_validate_tooltip_dirty2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Dirty2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إجراء تغييرات - جارٍ التحقق تلقائيًا...`)
};

/**
* | output |
* | --- |
* | "Changes made - validating automatically..." |
*
* @param {Developerportal_Credentialbuilder_Validate_Tooltip_Dirty2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validate_tooltip_dirty2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validate_Tooltip_Dirty2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validate_Tooltip_Dirty2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validate_tooltip_dirty2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validate_tooltip_dirty2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validate_tooltip_dirty2(inputs)
	return ar_developerportal_credentialbuilder_validate_tooltip_dirty2(inputs)
});
export { developerportal_credentialbuilder_validate_tooltip_dirty2 as "developerPortal.credentialBuilder.validate.tooltip.dirty" }