/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Passkey_ReplacingInputs */

const en_recovery_setup_passkey_replacing = /** @type {(inputs: Recovery_Setup_Passkey_ReplacingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replacing...`)
};

const es_recovery_setup_passkey_replacing = /** @type {(inputs: Recovery_Setup_Passkey_ReplacingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reemplazando...`)
};

const fr_recovery_setup_passkey_replacing = /** @type {(inputs: Recovery_Setup_Passkey_ReplacingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplacement en cours...`)
};

const ar_recovery_setup_passkey_replacing = /** @type {(inputs: Recovery_Setup_Passkey_ReplacingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replacing...`)
};

/**
* | output |
* | --- |
* | "Replacing..." |
*
* @param {Recovery_Setup_Passkey_ReplacingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_passkey_replacing = /** @type {((inputs?: Recovery_Setup_Passkey_ReplacingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Passkey_ReplacingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_passkey_replacing(inputs)
	if (locale === "es") return es_recovery_setup_passkey_replacing(inputs)
	if (locale === "fr") return fr_recovery_setup_passkey_replacing(inputs)
	return ar_recovery_setup_passkey_replacing(inputs)
});
export { recovery_setup_passkey_replacing as "recovery.setup.passkey.replacing" }