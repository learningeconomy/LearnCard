/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Passkeylabel1Inputs */

const en_recovery_method_passkeylabel1 = /** @type {(inputs: Recovery_Method_Passkeylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

const es_recovery_method_passkeylabel1 = /** @type {(inputs: Recovery_Method_Passkeylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

const fr_recovery_method_passkeylabel1 = /** @type {(inputs: Recovery_Method_Passkeylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé d'accès`)
};

const ar_recovery_method_passkeylabel1 = /** @type {(inputs: Recovery_Method_Passkeylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح المرور`)
};

/**
* | output |
* | --- |
* | "Passkey" |
*
* @param {Recovery_Method_Passkeylabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_passkeylabel1 = /** @type {((inputs?: Recovery_Method_Passkeylabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Passkeylabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_passkeylabel1(inputs)
	if (locale === "es") return es_recovery_method_passkeylabel1(inputs)
	if (locale === "fr") return fr_recovery_method_passkeylabel1(inputs)
	return ar_recovery_method_passkeylabel1(inputs)
});
export { recovery_method_passkeylabel1 as "recovery.method.passkeyLabel" }