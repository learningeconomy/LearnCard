/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Step_Findkey1Inputs */

const en_recovery_step_findkey1 = /** @type {(inputs: Recovery_Step_Findkey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Find the long string of characters between "RECOVERY KEY" and "END RECOVERY KEY"`)
};

const es_recovery_step_findkey1 = /** @type {(inputs: Recovery_Step_Findkey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Encuentra la cadena larga de caracteres entre "RECOVERY KEY" y "END RECOVERY KEY"`)
};

const fr_recovery_step_findkey1 = /** @type {(inputs: Recovery_Step_Findkey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trouvez la longue chaîne de caractères entre "RECOVERY KEY" et "END RECOVERY KEY"`)
};

const ar_recovery_step_findkey1 = /** @type {(inputs: Recovery_Step_Findkey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابحث عن السلسلة الطويلة من الأحرف بين "RECOVERY KEY" و "END RECOVERY KEY"`)
};

/**
* | output |
* | --- |
* | "Find the long string of characters between \"RECOVERY KEY\" and \"END RECOVERY KEY\"" |
*
* @param {Recovery_Step_Findkey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_step_findkey1 = /** @type {((inputs?: Recovery_Step_Findkey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Step_Findkey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_step_findkey1(inputs)
	if (locale === "es") return es_recovery_step_findkey1(inputs)
	if (locale === "fr") return fr_recovery_step_findkey1(inputs)
	return ar_recovery_step_findkey1(inputs)
});
export { recovery_step_findkey1 as "recovery.step.findKey" }