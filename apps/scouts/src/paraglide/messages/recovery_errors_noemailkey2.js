/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Errors_Noemailkey2Inputs */

const en_recovery_errors_noemailkey2 = /** @type {(inputs: Recovery_Errors_Noemailkey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please paste the recovery key from your email.`)
};

const es_recovery_errors_noemailkey2 = /** @type {(inputs: Recovery_Errors_Noemailkey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor pega la clave de recuperación de tu correo.`)
};

const fr_recovery_errors_noemailkey2 = /** @type {(inputs: Recovery_Errors_Noemailkey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez coller la clé de récupération envoyée par e-mail.`)
};

const ar_recovery_errors_noemailkey2 = /** @type {(inputs: Recovery_Errors_Noemailkey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please paste the recovery key from your email.`)
};

/**
* | output |
* | --- |
* | "Please paste the recovery key from your email." |
*
* @param {Recovery_Errors_Noemailkey2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_errors_noemailkey2 = /** @type {((inputs?: Recovery_Errors_Noemailkey2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Errors_Noemailkey2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_errors_noemailkey2(inputs)
	if (locale === "es") return es_recovery_errors_noemailkey2(inputs)
	if (locale === "fr") return fr_recovery_errors_noemailkey2(inputs)
	return ar_recovery_errors_noemailkey2(inputs)
});
export { recovery_errors_noemailkey2 as "recovery.errors.noEmailKey" }