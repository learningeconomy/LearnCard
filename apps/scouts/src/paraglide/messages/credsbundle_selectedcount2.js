/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Selectedcount2Inputs */

const en_credsbundle_selectedcount2 = /** @type {(inputs: Credsbundle_Selectedcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have selected {count} {type}s to share`)
};

const es_credsbundle_selectedcount2 = /** @type {(inputs: Credsbundle_Selectedcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Has seleccionado {count} {type}s para compartir`)
};

const fr_credsbundle_selectedcount2 = /** @type {(inputs: Credsbundle_Selectedcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez sélectionné {count} {type}(s) à partager`)
};

const ar_credsbundle_selectedcount2 = /** @type {(inputs: Credsbundle_Selectedcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد اخترت {count} {type} للمشاركة`)
};

/**
* | output |
* | --- |
* | "You have selected {count} {type}s to share" |
*
* @param {Credsbundle_Selectedcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_selectedcount2 = /** @type {((inputs?: Credsbundle_Selectedcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Selectedcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_selectedcount2(inputs)
	if (locale === "es") return es_credsbundle_selectedcount2(inputs)
	if (locale === "fr") return fr_credsbundle_selectedcount2(inputs)
	return ar_credsbundle_selectedcount2(inputs)
});
export { credsbundle_selectedcount2 as "credsBundle.selectedCount" }