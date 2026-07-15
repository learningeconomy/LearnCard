/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Passkey_DescInputs */

const en_recovery_setup_passkey_desc = /** @type {(inputs: Recovery_Setup_Passkey_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Face ID, Touch ID, or Windows Hello as your recovery method. Nothing to remember.`)
};

const es_recovery_setup_passkey_desc = /** @type {(inputs: Recovery_Setup_Passkey_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa Face ID, Touch ID o Windows Hello como método de recuperación. Nada que recordar.`)
};

const fr_recovery_setup_passkey_desc = /** @type {(inputs: Recovery_Setup_Passkey_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez Face ID, Touch ID ou Windows Hello comme méthode de récupération. Rien à retenir.`)
};

const ar_recovery_setup_passkey_desc = /** @type {(inputs: Recovery_Setup_Passkey_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم Face ID أو Touch ID أو Windows Hello كطريقة استرداد. لا شيء لتتذكره.`)
};

/**
* | output |
* | --- |
* | "Use Face ID, Touch ID, or Windows Hello as your recovery method. Nothing to remember." |
*
* @param {Recovery_Setup_Passkey_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_passkey_desc = /** @type {((inputs?: Recovery_Setup_Passkey_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Passkey_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_passkey_desc(inputs)
	if (locale === "es") return es_recovery_setup_passkey_desc(inputs)
	if (locale === "fr") return fr_recovery_setup_passkey_desc(inputs)
	return ar_recovery_setup_passkey_desc(inputs)
});
export { recovery_setup_passkey_desc as "recovery.setup.passkey.desc" }