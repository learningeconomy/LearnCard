/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_RecoveringInputs */

const en_recovery_recovering = /** @type {(inputs: Recovery_RecoveringInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovering...`)
};

const es_recovery_recovering = /** @type {(inputs: Recovery_RecoveringInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperando...`)
};

const fr_recovery_recovering = /** @type {(inputs: Recovery_RecoveringInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération...`)
};

const ar_recovery_recovering = /** @type {(inputs: Recovery_RecoveringInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الاسترداد...`)
};

/**
* | output |
* | --- |
* | "Recovering..." |
*
* @param {Recovery_RecoveringInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recovering = /** @type {((inputs?: Recovery_RecoveringInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_RecoveringInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recovering(inputs)
	if (locale === "es") return es_recovery_recovering(inputs)
	if (locale === "fr") return fr_recovery_recovering(inputs)
	return ar_recovery_recovering(inputs)
});
export { recovery_recovering as "recovery.recovering" }