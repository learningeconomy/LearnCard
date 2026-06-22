/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, state: NonNullable<unknown> }} Recovery_Method_Activecount1Inputs */

const en_recovery_method_activecount1 = /** @type {(inputs: Recovery_Method_Activecount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} recovery ${i?.state} active`)
};

const es_recovery_method_activecount1 = /** @type {(inputs: Recovery_Method_Activecount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} ${i?.state} de recuperación activo(s)`)
};

const fr_recovery_method_activecount1 = /** @type {(inputs: Recovery_Method_Activecount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} ${i?.state} de récupération actif(s)`)
};

const ar_recovery_method_activecount1 = /** @type {(inputs: Recovery_Method_Activecount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} ${i?.state} استرداد نشط`)
};

/**
* | output |
* | --- |
* | "{count} recovery {state} active" |
*
* @param {Recovery_Method_Activecount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_activecount1 = /** @type {((inputs: Recovery_Method_Activecount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Activecount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_activecount1(inputs)
	if (locale === "es") return es_recovery_method_activecount1(inputs)
	if (locale === "fr") return fr_recovery_method_activecount1(inputs)
	return ar_recovery_method_activecount1(inputs)
});
export { recovery_method_activecount1 as "recovery.method.activeCount" }