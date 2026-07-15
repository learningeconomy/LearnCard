/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_UpdateInputs */

const en_common_update = /** @type {(inputs: Common_UpdateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update`)
};

const es_common_update = /** @type {(inputs: Common_UpdateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar`)
};

const fr_common_update = /** @type {(inputs: Common_UpdateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre à jour`)
};

const ar_common_update = /** @type {(inputs: Common_UpdateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديث`)
};

/**
* | output |
* | --- |
* | "Update" |
*
* @param {Common_UpdateInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_update = /** @type {((inputs?: Common_UpdateInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_UpdateInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_update(inputs)
	if (locale === "es") return es_common_update(inputs)
	if (locale === "fr") return fr_common_update(inputs)
	return ar_common_update(inputs)
});
export { common_update as "common.update" }