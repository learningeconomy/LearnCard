/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Verifypasskey1Inputs */

const en_recovery_verifypasskey1 = /** @type {(inputs: Recovery_Verifypasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify with Passkey`)
};

const es_recovery_verifypasskey1 = /** @type {(inputs: Recovery_Verifypasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar con clave de acceso`)
};

const fr_recovery_verifypasskey1 = /** @type {(inputs: Recovery_Verifypasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier avec une clé d'accès`)
};

const ar_recovery_verifypasskey1 = /** @type {(inputs: Recovery_Verifypasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق بمفتاح المرور`)
};

/**
* | output |
* | --- |
* | "Verify with Passkey" |
*
* @param {Recovery_Verifypasskey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_verifypasskey1 = /** @type {((inputs?: Recovery_Verifypasskey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Verifypasskey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_verifypasskey1(inputs)
	if (locale === "es") return es_recovery_verifypasskey1(inputs)
	if (locale === "fr") return fr_recovery_verifypasskey1(inputs)
	return ar_recovery_verifypasskey1(inputs)
});
export { recovery_verifypasskey1 as "recovery.verifyPasskey" }