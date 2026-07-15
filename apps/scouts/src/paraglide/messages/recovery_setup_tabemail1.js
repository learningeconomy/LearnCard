/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Tabemail1Inputs */

const en_recovery_setup_tabemail1 = /** @type {(inputs: Recovery_Setup_Tabemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email`)
};

const es_recovery_setup_tabemail1 = /** @type {(inputs: Recovery_Setup_Tabemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo`)
};

const fr_recovery_setup_tabemail1 = /** @type {(inputs: Recovery_Setup_Tabemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail`)
};

const ar_recovery_setup_tabemail1 = /** @type {(inputs: Recovery_Setup_Tabemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email" |
*
* @param {Recovery_Setup_Tabemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_tabemail1 = /** @type {((inputs?: Recovery_Setup_Tabemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Tabemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_tabemail1(inputs)
	if (locale === "es") return es_recovery_setup_tabemail1(inputs)
	if (locale === "fr") return fr_recovery_setup_tabemail1(inputs)
	return ar_recovery_setup_tabemail1(inputs)
});
export { recovery_setup_tabemail1 as "recovery.setup.tabEmail" }