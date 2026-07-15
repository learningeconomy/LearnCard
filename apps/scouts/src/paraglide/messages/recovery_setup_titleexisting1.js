/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Titleexisting1Inputs */

const en_recovery_setup_titleexisting1 = /** @type {(inputs: Recovery_Setup_Titleexisting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Account Recovery`)
};

const es_recovery_setup_titleexisting1 = /** @type {(inputs: Recovery_Setup_Titleexisting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperación de Cuenta`)
};

const fr_recovery_setup_titleexisting1 = /** @type {(inputs: Recovery_Setup_Titleexisting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération du compte`)
};

const ar_recovery_setup_titleexisting1 = /** @type {(inputs: Recovery_Setup_Titleexisting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Account Recovery`)
};

/**
* | output |
* | --- |
* | "Account Recovery" |
*
* @param {Recovery_Setup_Titleexisting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_titleexisting1 = /** @type {((inputs?: Recovery_Setup_Titleexisting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Titleexisting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_titleexisting1(inputs)
	if (locale === "es") return es_recovery_setup_titleexisting1(inputs)
	if (locale === "fr") return fr_recovery_setup_titleexisting1(inputs)
	return ar_recovery_setup_titleexisting1(inputs)
});
export { recovery_setup_titleexisting1 as "recovery.setup.titleExisting" }