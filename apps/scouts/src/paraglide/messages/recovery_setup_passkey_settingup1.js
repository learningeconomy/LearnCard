/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Passkey_Settingup1Inputs */

const en_recovery_setup_passkey_settingup1 = /** @type {(inputs: Recovery_Setup_Passkey_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Setting up...`)
};

const es_recovery_setup_passkey_settingup1 = /** @type {(inputs: Recovery_Setup_Passkey_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurando...`)
};

const fr_recovery_setup_passkey_settingup1 = /** @type {(inputs: Recovery_Setup_Passkey_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration en cours...`)
};

const ar_recovery_setup_passkey_settingup1 = /** @type {(inputs: Recovery_Setup_Passkey_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإعداد...`)
};

/**
* | output |
* | --- |
* | "Setting up..." |
*
* @param {Recovery_Setup_Passkey_Settingup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_passkey_settingup1 = /** @type {((inputs?: Recovery_Setup_Passkey_Settingup1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Passkey_Settingup1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_passkey_settingup1(inputs)
	if (locale === "es") return es_recovery_setup_passkey_settingup1(inputs)
	if (locale === "fr") return fr_recovery_setup_passkey_settingup1(inputs)
	return ar_recovery_setup_passkey_settingup1(inputs)
});
export { recovery_setup_passkey_settingup1 as "recovery.setup.passkey.settingUp" }