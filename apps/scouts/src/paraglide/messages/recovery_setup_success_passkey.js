/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Success_PasskeyInputs */

const en_recovery_setup_success_passkey = /** @type {(inputs: Recovery_Setup_Success_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey recovery is set up!`)
};

const es_recovery_setup_success_passkey = /** @type {(inputs: Recovery_Setup_Success_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Recuperación con Passkey configurada!`)
};

const fr_recovery_setup_success_passkey = /** @type {(inputs: Recovery_Setup_Success_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La récupération par clé d'accès est configurée !`)
};

const ar_recovery_setup_success_passkey = /** @type {(inputs: Recovery_Setup_Success_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إعداد استرداد مفتاح المرور!`)
};

/**
* | output |
* | --- |
* | "Passkey recovery is set up!" |
*
* @param {Recovery_Setup_Success_PasskeyInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_success_passkey = /** @type {((inputs?: Recovery_Setup_Success_PasskeyInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Success_PasskeyInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_success_passkey(inputs)
	if (locale === "es") return es_recovery_setup_success_passkey(inputs)
	if (locale === "fr") return fr_recovery_setup_success_passkey(inputs)
	return ar_recovery_setup_success_passkey(inputs)
});
export { recovery_setup_success_passkey as "recovery.setup.success.passkey" }