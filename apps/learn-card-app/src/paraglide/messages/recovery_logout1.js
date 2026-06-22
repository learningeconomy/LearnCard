/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Logout1Inputs */

const en_recovery_logout1 = /** @type {(inputs: Recovery_Logout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Log Out`)
};

const es_recovery_logout1 = /** @type {(inputs: Recovery_Logout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar sesión`)
};

const fr_recovery_logout1 = /** @type {(inputs: Recovery_Logout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se déconnecter`)
};

const ar_recovery_logout1 = /** @type {(inputs: Recovery_Logout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الخروج`)
};

/**
* | output |
* | --- |
* | "Log Out" |
*
* @param {Recovery_Logout1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_logout1 = /** @type {((inputs?: Recovery_Logout1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Logout1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_logout1(inputs)
	if (locale === "es") return es_recovery_logout1(inputs)
	if (locale === "fr") return fr_recovery_logout1(inputs)
	return ar_recovery_logout1(inputs)
});
export { recovery_logout1 as "recovery.logOut" }