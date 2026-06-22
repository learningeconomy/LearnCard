/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Step_Copykey1Inputs */

const en_recovery_step_copykey1 = /** @type {(inputs: Recovery_Step_Copykey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy that entire string and paste it below`)
};

const es_recovery_step_copykey1 = /** @type {(inputs: Recovery_Step_Copykey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia esa cadena completa y pégala abajo`)
};

const fr_recovery_step_copykey1 = /** @type {(inputs: Recovery_Step_Copykey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez toute cette chaîne et collez-la ci-dessous`)
};

const ar_recovery_step_copykey1 = /** @type {(inputs: Recovery_Step_Copykey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ تلك السلسلة بالكامل والصقها أدناه`)
};

/**
* | output |
* | --- |
* | "Copy that entire string and paste it below" |
*
* @param {Recovery_Step_Copykey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_step_copykey1 = /** @type {((inputs?: Recovery_Step_Copykey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Step_Copykey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_step_copykey1(inputs)
	if (locale === "es") return es_recovery_step_copykey1(inputs)
	if (locale === "fr") return fr_recovery_step_copykey1(inputs)
	return ar_recovery_step_copykey1(inputs)
});
export { recovery_step_copykey1 as "recovery.step.copyKey" }