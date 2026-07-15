/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Selectbooststoshare4Inputs */

const en_credsbundle_selectbooststoshare4 = /** @type {(inputs: Credsbundle_Selectbooststoshare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Earned Boosts To Share`)
};

const es_credsbundle_selectbooststoshare4 = /** @type {(inputs: Credsbundle_Selectbooststoshare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Boosts Obtenidos para Compartir`)
};

const fr_credsbundle_selectbooststoshare4 = /** @type {(inputs: Credsbundle_Selectbooststoshare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez les Boosts à partager`)
};

const ar_credsbundle_selectbooststoshare4 = /** @type {(inputs: Credsbundle_Selectbooststoshare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Earned Boosts To Share`)
};

/**
* | output |
* | --- |
* | "Select Earned Boosts To Share" |
*
* @param {Credsbundle_Selectbooststoshare4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_selectbooststoshare4 = /** @type {((inputs?: Credsbundle_Selectbooststoshare4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Selectbooststoshare4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_selectbooststoshare4(inputs)
	if (locale === "es") return es_credsbundle_selectbooststoshare4(inputs)
	if (locale === "fr") return fr_credsbundle_selectbooststoshare4(inputs)
	return ar_credsbundle_selectbooststoshare4(inputs)
});
export { credsbundle_selectbooststoshare4 as "credsBundle.selectBoostsToShare" }