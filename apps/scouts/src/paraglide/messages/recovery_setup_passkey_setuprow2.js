/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Passkey_Setuprow2Inputs */

const en_recovery_setup_passkey_setuprow2 = /** @type {(inputs: Recovery_Setup_Passkey_Setuprow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey is set up`)
};

const es_recovery_setup_passkey_setuprow2 = /** @type {(inputs: Recovery_Setup_Passkey_Setuprow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey configurada`)
};

const fr_recovery_setup_passkey_setuprow2 = /** @type {(inputs: Recovery_Setup_Passkey_Setuprow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La clé d'accès est configurée`)
};

const ar_recovery_setup_passkey_setuprow2 = /** @type {(inputs: Recovery_Setup_Passkey_Setuprow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إعداد مفتاح المرور`)
};

/**
* | output |
* | --- |
* | "Passkey is set up" |
*
* @param {Recovery_Setup_Passkey_Setuprow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_passkey_setuprow2 = /** @type {((inputs?: Recovery_Setup_Passkey_Setuprow2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Passkey_Setuprow2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_passkey_setuprow2(inputs)
	if (locale === "es") return es_recovery_setup_passkey_setuprow2(inputs)
	if (locale === "fr") return fr_recovery_setup_passkey_setuprow2(inputs)
	return ar_recovery_setup_passkey_setuprow2(inputs)
});
export { recovery_setup_passkey_setuprow2 as "recovery.setup.passkey.setUpRow" }