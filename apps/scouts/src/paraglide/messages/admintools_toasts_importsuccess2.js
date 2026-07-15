/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Toasts_Importsuccess2Inputs */

const en_admintools_toasts_importsuccess2 = /** @type {(inputs: Admintools_Toasts_Importsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts imported successfully!`)
};

const es_admintools_toasts_importsuccess2 = /** @type {(inputs: Admintools_Toasts_Importsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Boosts importados exitosamente!`)
};

const fr_admintools_toasts_importsuccess2 = /** @type {(inputs: Admintools_Toasts_Importsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts importés avec succès !`)
};

const ar_admintools_toasts_importsuccess2 = /** @type {(inputs: Admintools_Toasts_Importsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts imported successfully!`)
};

/**
* | output |
* | --- |
* | "Boosts imported successfully!" |
*
* @param {Admintools_Toasts_Importsuccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_toasts_importsuccess2 = /** @type {((inputs?: Admintools_Toasts_Importsuccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Toasts_Importsuccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_toasts_importsuccess2(inputs)
	if (locale === "es") return es_admintools_toasts_importsuccess2(inputs)
	if (locale === "fr") return fr_admintools_toasts_importsuccess2(inputs)
	return ar_admintools_toasts_importsuccess2(inputs)
});
export { admintools_toasts_importsuccess2 as "adminTools.toasts.importSuccess" }