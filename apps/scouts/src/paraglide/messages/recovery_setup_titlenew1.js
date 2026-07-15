/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Titlenew1Inputs */

const en_recovery_setup_titlenew1 = /** @type {(inputs: Recovery_Setup_Titlenew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protect Your Account`)
};

const es_recovery_setup_titlenew1 = /** @type {(inputs: Recovery_Setup_Titlenew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protege Tu Cuenta`)
};

const fr_recovery_setup_titlenew1 = /** @type {(inputs: Recovery_Setup_Titlenew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protégez votre compte`)
};

const ar_recovery_setup_titlenew1 = /** @type {(inputs: Recovery_Setup_Titlenew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protect Your Account`)
};

/**
* | output |
* | --- |
* | "Protect Your Account" |
*
* @param {Recovery_Setup_Titlenew1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_titlenew1 = /** @type {((inputs?: Recovery_Setup_Titlenew1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Titlenew1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_titlenew1(inputs)
	if (locale === "es") return es_recovery_setup_titlenew1(inputs)
	if (locale === "fr") return fr_recovery_setup_titlenew1(inputs)
	return ar_recovery_setup_titlenew1(inputs)
});
export { recovery_setup_titlenew1 as "recovery.setup.titleNew" }