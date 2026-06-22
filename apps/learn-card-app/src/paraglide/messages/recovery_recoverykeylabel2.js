/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Recoverykeylabel2Inputs */

const en_recovery_recoverykeylabel2 = /** @type {(inputs: Recovery_Recoverykeylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery Key`)
};

const es_recovery_recoverykeylabel2 = /** @type {(inputs: Recovery_Recoverykeylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de recuperación`)
};

const fr_recovery_recoverykeylabel2 = /** @type {(inputs: Recovery_Recoverykeylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération`)
};

const ar_recovery_recoverykeylabel2 = /** @type {(inputs: Recovery_Recoverykeylabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح الاسترداد`)
};

/**
* | output |
* | --- |
* | "Recovery Key" |
*
* @param {Recovery_Recoverykeylabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recoverykeylabel2 = /** @type {((inputs?: Recovery_Recoverykeylabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recoverykeylabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recoverykeylabel2(inputs)
	if (locale === "es") return es_recovery_recoverykeylabel2(inputs)
	if (locale === "fr") return fr_recovery_recoverykeylabel2(inputs)
	return ar_recovery_recoverykeylabel2(inputs)
});
export { recovery_recoverykeylabel2 as "recovery.recoveryKeyLabel" }