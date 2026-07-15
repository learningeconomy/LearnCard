/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Recovery_Setup_Descmethodsactive2Inputs */

const en_recovery_setup_descmethodsactive2 = /** @type {(inputs: Recovery_Setup_Descmethodsactive2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} recovery method(s) active`)
};

const es_recovery_setup_descmethodsactive2 = /** @type {(inputs: Recovery_Setup_Descmethodsactive2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} método(s) de recuperación activo(s)`)
};

const fr_recovery_setup_descmethodsactive2 = /** @type {(inputs: Recovery_Setup_Descmethodsactive2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} méthode(s) de récupération active(s)`)
};

const ar_recovery_setup_descmethodsactive2 = /** @type {(inputs: Recovery_Setup_Descmethodsactive2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} recovery method(s) active`)
};

/**
* | output |
* | --- |
* | "{count} recovery method(s) active" |
*
* @param {Recovery_Setup_Descmethodsactive2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_descmethodsactive2 = /** @type {((inputs: Recovery_Setup_Descmethodsactive2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Descmethodsactive2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_descmethodsactive2(inputs)
	if (locale === "es") return es_recovery_setup_descmethodsactive2(inputs)
	if (locale === "fr") return fr_recovery_setup_descmethodsactive2(inputs)
	return ar_recovery_setup_descmethodsactive2(inputs)
});
export { recovery_setup_descmethodsactive2 as "recovery.setup.descMethodsActive" }