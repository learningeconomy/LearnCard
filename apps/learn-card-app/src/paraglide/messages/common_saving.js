/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_SavingInputs */

const en_common_saving = /** @type {(inputs: Common_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_common_saving = /** @type {(inputs: Common_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const fr_common_saving = /** @type {(inputs: Common_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

const ar_common_saving = /** @type {(inputs: Common_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الحفظ...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Common_SavingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_saving = /** @type {((inputs?: Common_SavingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_SavingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_saving(inputs)
	if (locale === "es") return es_common_saving(inputs)
	if (locale === "fr") return fr_common_saving(inputs)
	return ar_common_saving(inputs)
});
export { common_saving as "common.saving" }