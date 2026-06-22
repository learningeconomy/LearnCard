/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Replacepasskey1Inputs */

const en_recovery_replacepasskey1 = /** @type {(inputs: Recovery_Replacepasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will replace your current passkey.`)
};

const es_recovery_replacepasskey1 = /** @type {(inputs: Recovery_Replacepasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto reemplazará tu clave de acceso actual.`)
};

const fr_recovery_replacepasskey1 = /** @type {(inputs: Recovery_Replacepasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela remplacera votre clé d'accès actuelle.`)
};

const ar_recovery_replacepasskey1 = /** @type {(inputs: Recovery_Replacepasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيؤدي هذا إلى استبدال مفتاح المرور الحالي.`)
};

/**
* | output |
* | --- |
* | "This will replace your current passkey." |
*
* @param {Recovery_Replacepasskey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_replacepasskey1 = /** @type {((inputs?: Recovery_Replacepasskey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Replacepasskey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_replacepasskey1(inputs)
	if (locale === "es") return es_recovery_replacepasskey1(inputs)
	if (locale === "fr") return fr_recovery_replacepasskey1(inputs)
	return ar_recovery_replacepasskey1(inputs)
});
export { recovery_replacepasskey1 as "recovery.replacePasskey" }