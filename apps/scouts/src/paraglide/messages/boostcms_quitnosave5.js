/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Quitnosave5Inputs */

const en_boostcms_quitnosave5 = /** @type {(inputs: Boostcms_Quitnosave5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quit Without Saving`)
};

const es_boostcms_quitnosave5 = /** @type {(inputs: Boostcms_Quitnosave5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salir Sin Guardar`)
};

const fr_boostcms_quitnosave5 = /** @type {(inputs: Boostcms_Quitnosave5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter sans sauvegarder`)
};

const ar_boostcms_quitnosave5 = /** @type {(inputs: Boostcms_Quitnosave5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quit Without Saving`)
};

/**
* | output |
* | --- |
* | "Quit Without Saving" |
*
* @param {Boostcms_Quitnosave5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_quitnosave5 = /** @type {((inputs?: Boostcms_Quitnosave5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Quitnosave5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_quitnosave5(inputs)
	if (locale === "es") return es_boostcms_quitnosave5(inputs)
	if (locale === "fr") return fr_boostcms_quitnosave5(inputs)
	return ar_boostcms_quitnosave5(inputs)
});
export { boostcms_quitnosave5 as "boostCMS.quitNoSave" }