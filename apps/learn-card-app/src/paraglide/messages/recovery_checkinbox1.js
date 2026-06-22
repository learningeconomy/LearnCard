/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Checkinbox1Inputs */

const en_recovery_checkinbox1 = /** @type {(inputs: Recovery_Checkinbox1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check your inbox.`)
};

const es_recovery_checkinbox1 = /** @type {(inputs: Recovery_Checkinbox1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisa tu bandeja de entrada.`)
};

const fr_recovery_checkinbox1 = /** @type {(inputs: Recovery_Checkinbox1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez votre boîte de réception.`)
};

const ar_recovery_checkinbox1 = /** @type {(inputs: Recovery_Checkinbox1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من بريدك الوارد.`)
};

/**
* | output |
* | --- |
* | "Check your inbox." |
*
* @param {Recovery_Checkinbox1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_checkinbox1 = /** @type {((inputs?: Recovery_Checkinbox1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Checkinbox1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_checkinbox1(inputs)
	if (locale === "es") return es_recovery_checkinbox1(inputs)
	if (locale === "fr") return fr_recovery_checkinbox1(inputs)
	return ar_recovery_checkinbox1(inputs)
});
export { recovery_checkinbox1 as "recovery.checkInbox" }