/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Changebtn1Inputs */

const en_recovery_setup_changebtn1 = /** @type {(inputs: Recovery_Setup_Changebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change`)
};

const es_recovery_setup_changebtn1 = /** @type {(inputs: Recovery_Setup_Changebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar`)
};

const fr_recovery_setup_changebtn1 = /** @type {(inputs: Recovery_Setup_Changebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_recovery_setup_changebtn1 = /** @type {(inputs: Recovery_Setup_Changebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير`)
};

/**
* | output |
* | --- |
* | "Change" |
*
* @param {Recovery_Setup_Changebtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_changebtn1 = /** @type {((inputs?: Recovery_Setup_Changebtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Changebtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_changebtn1(inputs)
	if (locale === "es") return es_recovery_setup_changebtn1(inputs)
	if (locale === "fr") return fr_recovery_setup_changebtn1(inputs)
	return ar_recovery_setup_changebtn1(inputs)
});
export { recovery_setup_changebtn1 as "recovery.setup.changeBtn" }