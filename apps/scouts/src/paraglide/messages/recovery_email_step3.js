/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_Step3Inputs */

const en_recovery_email_step3 = /** @type {(inputs: Recovery_Email_Step3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy that entire string and paste it below`)
};

const es_recovery_email_step3 = /** @type {(inputs: Recovery_Email_Step3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia toda esa cadena y pégala abajo`)
};

const fr_recovery_email_step3 = /** @type {(inputs: Recovery_Email_Step3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez cette chaîne entière et collez-la ci-dessous`)
};

const ar_recovery_email_step3 = /** @type {(inputs: Recovery_Email_Step3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ تلك السلسلة بالكامل والصقها أدناه`)
};

/**
* | output |
* | --- |
* | "Copy that entire string and paste it below" |
*
* @param {Recovery_Email_Step3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_step3 = /** @type {((inputs?: Recovery_Email_Step3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Email_Step3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_email_step3(inputs)
	if (locale === "es") return es_recovery_email_step3(inputs)
	if (locale === "fr") return fr_recovery_email_step3(inputs)
	return ar_recovery_email_step3(inputs)
});
export { recovery_email_step3 as "recovery.email.step3" }