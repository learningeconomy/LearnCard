/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkeydesktoponly2Inputs */

const en_recovery_passkeydesktoponly2 = /** @type {(inputs: Recovery_Passkeydesktoponly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkeys with encryption are currently supported on desktop Chrome and Edge only.`)
};

const es_recovery_passkeydesktoponly2 = /** @type {(inputs: Recovery_Passkeydesktoponly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las claves de acceso con cifrado solo son compatibles con Chrome y Edge de escritorio actualmente.`)
};

const fr_recovery_passkeydesktoponly2 = /** @type {(inputs: Recovery_Passkeydesktoponly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les clés d'accès avec chiffrement ne sont actuellement prises en charge que sur Chrome et Edge pour ordinateur.`)
};

const ar_recovery_passkeydesktoponly2 = /** @type {(inputs: Recovery_Passkeydesktoponly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفاتيح المرور المشفرة مدعومة حاليًا فقط على Chrome و Edge لسطح المكتب.`)
};

/**
* | output |
* | --- |
* | "Passkeys with encryption are currently supported on desktop Chrome and Edge only." |
*
* @param {Recovery_Passkeydesktoponly2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkeydesktoponly2 = /** @type {((inputs?: Recovery_Passkeydesktoponly2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkeydesktoponly2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkeydesktoponly2(inputs)
	if (locale === "es") return es_recovery_passkeydesktoponly2(inputs)
	if (locale === "fr") return fr_recovery_passkeydesktoponly2(inputs)
	return ar_recovery_passkeydesktoponly2(inputs)
});
export { recovery_passkeydesktoponly2 as "recovery.passkeyDesktopOnly" }