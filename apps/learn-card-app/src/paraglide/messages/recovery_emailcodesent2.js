/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Emailcodesent2Inputs */

const en_recovery_emailcodesent2 = /** @type {(inputs: Recovery_Emailcodesent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We sent a 6-digit code to`)
};

const es_recovery_emailcodesent2 = /** @type {(inputs: Recovery_Emailcodesent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviamos un código de 6 dígitos a`)
};

const fr_recovery_emailcodesent2 = /** @type {(inputs: Recovery_Emailcodesent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous avons envoyé un code à 6 chiffres à`)
};

const ar_recovery_emailcodesent2 = /** @type {(inputs: Recovery_Emailcodesent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسلنا رمزًا من 6 أرقام إلى`)
};

/**
* | output |
* | --- |
* | "We sent a 6-digit code to" |
*
* @param {Recovery_Emailcodesent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_emailcodesent2 = /** @type {((inputs?: Recovery_Emailcodesent2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Emailcodesent2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_emailcodesent2(inputs)
	if (locale === "es") return es_recovery_emailcodesent2(inputs)
	if (locale === "fr") return fr_recovery_emailcodesent2(inputs)
	return ar_recovery_emailcodesent2(inputs)
});
export { recovery_emailcodesent2 as "recovery.emailCodeSent" }