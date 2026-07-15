/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Passkey_Chromeonly1Inputs */

const en_recovery_setup_passkey_chromeonly1 = /** @type {(inputs: Recovery_Setup_Passkey_Chromeonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkeys with encryption are currently supported on desktop Chrome and Edge only.`)
};

const es_recovery_setup_passkey_chromeonly1 = /** @type {(inputs: Recovery_Setup_Passkey_Chromeonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las passkeys con encriptación solo son compatibles actualmente con Chrome y Edge de escritorio.`)
};

const fr_recovery_setup_passkey_chromeonly1 = /** @type {(inputs: Recovery_Setup_Passkey_Chromeonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les clés d'accès avec chiffrement sont actuellement prises en charge uniquement sur Chrome et Edge (ordinateur).`)
};

const ar_recovery_setup_passkey_chromeonly1 = /** @type {(inputs: Recovery_Setup_Passkey_Chromeonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkeys with encryption are currently supported on desktop Chrome and Edge only.`)
};

/**
* | output |
* | --- |
* | "Passkeys with encryption are currently supported on desktop Chrome and Edge only." |
*
* @param {Recovery_Setup_Passkey_Chromeonly1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_passkey_chromeonly1 = /** @type {((inputs?: Recovery_Setup_Passkey_Chromeonly1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Passkey_Chromeonly1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_passkey_chromeonly1(inputs)
	if (locale === "es") return es_recovery_setup_passkey_chromeonly1(inputs)
	if (locale === "fr") return fr_recovery_setup_passkey_chromeonly1(inputs)
	return ar_recovery_setup_passkey_chromeonly1(inputs)
});
export { recovery_setup_passkey_chromeonly1 as "recovery.setup.passkey.chromeOnly" }