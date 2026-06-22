/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Emailrecoverylabel2Inputs */

const en_recovery_emailrecoverylabel2 = /** @type {(inputs: Recovery_Emailrecoverylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Recovery Key`)
};

const es_recovery_emailrecoverylabel2 = /** @type {(inputs: Recovery_Emailrecoverylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de recuperación por correo`)
};

const fr_recovery_emailrecoverylabel2 = /** @type {(inputs: Recovery_Emailrecoverylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération par e-mail`)
};

const ar_recovery_emailrecoverylabel2 = /** @type {(inputs: Recovery_Emailrecoverylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح استرداد البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email Recovery Key" |
*
* @param {Recovery_Emailrecoverylabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_emailrecoverylabel2 = /** @type {((inputs?: Recovery_Emailrecoverylabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Emailrecoverylabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_emailrecoverylabel2(inputs)
	if (locale === "es") return es_recovery_emailrecoverylabel2(inputs)
	if (locale === "fr") return fr_recovery_emailrecoverylabel2(inputs)
	return ar_recovery_emailrecoverylabel2(inputs)
});
export { recovery_emailrecoverylabel2 as "recovery.emailRecoveryLabel" }