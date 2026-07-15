/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_RecommendedInputs */

const en_recovery_setup_email_recommended = /** @type {(inputs: Recovery_Setup_Email_RecommendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommended`)
};

const es_recovery_setup_email_recommended = /** @type {(inputs: Recovery_Setup_Email_RecommendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recomendado`)
};

const fr_recovery_setup_email_recommended = /** @type {(inputs: Recovery_Setup_Email_RecommendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandé`)
};

const ar_recovery_setup_email_recommended = /** @type {(inputs: Recovery_Setup_Email_RecommendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موصى به`)
};

/**
* | output |
* | --- |
* | "Recommended" |
*
* @param {Recovery_Setup_Email_RecommendedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_recommended = /** @type {((inputs?: Recovery_Setup_Email_RecommendedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_RecommendedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_recommended(inputs)
	if (locale === "es") return es_recovery_setup_email_recommended(inputs)
	if (locale === "fr") return fr_recovery_setup_email_recommended(inputs)
	return ar_recovery_setup_email_recommended(inputs)
});
export { recovery_setup_email_recommended as "recovery.setup.email.recommended" }